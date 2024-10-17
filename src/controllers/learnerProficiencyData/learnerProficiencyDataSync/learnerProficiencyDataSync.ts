import { Request, Response } from 'express';
import * as _ from 'lodash';
import httpStatus from 'http-status';
import { schemaValidation } from '../../../services/validationService';
import learnerProficiencyDataSyncJSON from './syncLearnerProficiencyDataValidationSchema.json';
import logger from '../../../utils/logger';
import { ResponseHandler } from '../../../utils/responseHandler';
import { amlError } from '../../../types/amlError';
import {
  createLearnerProficiencyQuestionLevelData,
  createLearnerProficiencyQuestionSetLevelData,
  getQuestionLevelDataByLearnerIdQuestionIdAndQuestionSetId,
  getQuestionLevelDataRecordsForLearner,
  getQuestionSetLevelDataByLearnerIdAndQuestionSetId,
  getRecordsForLearnerByQuestionSetId,
  updateLearnerProficiencyQuestionLevelData,
  updateLearnerProficiencyQuestionSetLevelData,
} from '../../../services/learnerProficiencyData';
import { getQuestionSetsByIdentifiers } from '../../../services/questionSet';
import { getQuestionsByIdentifiers, getQuestionsCountForQuestionSet } from '../../../services/question';
import * as uuid from 'uuid';
import {
  aggregateLearnerData,
  calculateAverageScoreForQuestionSet,
  calculateSubSkillScoresForQuestion,
  calculateSubSkillScoresForQuestionSet,
  getAggregateDataForGivenTaxonomyKey,
  getScoreForTheQuestion,
} from './aggregation.helper';
import { createLearnerJourney, readLearnerJourneyByLearnerIdAndQuestionSetId, updateLearnerJourney } from '../../../services/learnerJourney';
import { LearnerJourneyStatus } from '../../../enums/learnerJourneyStatus';
import moment from 'moment';
import { Learner } from '../../../models/learner';

const aggregateLearnerDataOnClassAndSkillLevel = async (learner: Learner, questionLevelData: any[]) => {
  const classMap = getAggregateDataForGivenTaxonomyKey(questionLevelData, 'class');
  const l1SkillMap = getAggregateDataForGivenTaxonomyKey(questionLevelData, 'l1_skill');
  const l2SkillMap = getAggregateDataForGivenTaxonomyKey(questionLevelData, 'l2_skill');
  const l3SkillMap = getAggregateDataForGivenTaxonomyKey(questionLevelData, 'l3_skill');

  await aggregateLearnerData(learner, 'class_id', classMap);
  await aggregateLearnerData(learner, 'l1_skill_id', l1SkillMap);
  await aggregateLearnerData(learner, 'l2_skill_id', l2SkillMap);
  await aggregateLearnerData(learner, 'l3_skill_id', l3SkillMap);
};

const learnerProficiencyDataSync = async (req: Request, res: Response) => {
  const apiId = _.get(req, 'id');
  const requestBody = _.get(req, 'body');
  const msgid = _.get(req, ['body', 'params', 'msgid']);
  const dataBody = _.get(req, 'body.request');
  const resmsgid = _.get(res, 'resmsgid');
  const learner = (req as any).learner;

  const isRequestValid: Record<string, any> = schemaValidation(requestBody, learnerProficiencyDataSyncJSON);

  if (!isRequestValid.isValid) {
    const code = 'LEARNER_PROFICIENCY_DATA_INVALID_INPUT';
    logger.error({ code, apiId, msgid, resmsgid, requestBody, message: isRequestValid.message });
    throw amlError(code, isRequestValid.message, 'BAD_REQUEST', 400);
  }

  const { learner_id, questions_data } = dataBody;

  if (learner.identifier !== learner_id) {
    const code = 'LEARNER_DOES_NOT_EXIST';
    logger.error({ code, apiId, msgid, resmsgid, message: 'Learner does not exist' });
    throw amlError(code, 'Learner does not exist', 'NOT_FOUND', 404);
  }

  const questionMap: any = {};
  const questionSetTimestampMap: { [id: string]: { start_time?: string; end_time?: string } } = {};

  /**
   * DB QUERIES
   */
  const questionIds = questions_data.map((datum: any) => datum.question_id);
  const questions = await getQuestionsByIdentifiers(questionIds);

  const questionSetIds = _.uniq(questions_data.map((datum: any) => datum.question_set_id));
  const questionSets = await getQuestionSetsByIdentifiers(questionSetIds as string[]);

  for (const question of questions) {
    _.set(questionMap, question.identifier, question);
  }

  /**
   * Updating question level data in the following block
   */
  for (const datum of questions_data) {
    const { question_id, question_set_id, start_time, end_time } = datum;
    const learner_response = datum.learner_response as { result: string; answerTop?: string };
    const question = _.get(questionMap, question_id, undefined);

    /**
     * Validating question_id
     */
    if (!question) {
      logger.error({ apiId, msgid, resmsgid, requestBody, message: `question with identifier ${question_id} not found` });
      continue;
    }

    const score = getScoreForTheQuestion(question, learner_response);

    const subSkillScores = calculateSubSkillScoresForQuestion(question, learner_response);

    /**
     * If an entry already exists for the (learner_id, question_id, question_set_id) pair, then we increment the attempt count & update the new values
     */
    const learnerDataExists = await getQuestionLevelDataByLearnerIdQuestionIdAndQuestionSetId(learner_id, question_id, question_set_id);
    if (!_.isEmpty(learnerDataExists)) {
      const updateData = {
        ...datum,
        score,
        sub_skills: subSkillScores,
        attempts_count: learnerDataExists.attempts_count + 1,
        learner_response,
        updated_by: learner_id,
      };
      await updateLearnerProficiencyQuestionLevelData(learnerDataExists.identifier, updateData);
      continue;
    }

    await createLearnerProficiencyQuestionLevelData({
      ...datum,
      identifier: uuid.v4(),
      learner_id,
      score,
      question_set_id: question_set_id,
      taxonomy: question.taxonomy,
      learner_response,
      sub_skills: subSkillScores,
      created_by: learner_id,
    });

    if (start_time && moment(start_time).isValid()) {
      _.set(questionSetTimestampMap, [question_set_id, 'start_time'], start_time);
    }

    if (end_time && moment(start_time).isValid()) {
      _.set(questionSetTimestampMap, [question_set_id, 'end_time'], end_time);
    }
  }

  /**
   * Updating question set level data in the following block
   */
  for (const questionSet of questionSets) {
    const totalQuestionsCount = await getQuestionsCountForQuestionSet(questionSet.identifier);
    const attemptedQuestions = await getRecordsForLearnerByQuestionSetId(learner_id, questionSet.identifier);
    const allQuestionsHaveEqualNumberOfAttempts = attemptedQuestions.every((question: { attempts_count: number }) => question.attempts_count === (attemptedQuestions?.[0]?.attempts_count || 0));
    if (totalQuestionsCount === attemptedQuestions.length && totalQuestionsCount > 0 && allQuestionsHaveEqualNumberOfAttempts) {
      const avgScore = calculateAverageScoreForQuestionSet(attemptedQuestions);
      const subSkillScores = calculateSubSkillScoresForQuestionSet(attemptedQuestions);
      /**
       * If an entry already exists for the (learner_id, question_set_id) pair, then we increment the attempt count
       */
      const learnerDataExists = await getQuestionSetLevelDataByLearnerIdAndQuestionSetId(learner_id, questionSet.identifier);
      if (!_.isEmpty(learnerDataExists)) {
        const updateData = {
          score: avgScore,
          sub_skills: subSkillScores,
          attempts_count: learnerDataExists.attempts_count + 1,
          updated_by: learner_id,
        };
        await updateLearnerProficiencyQuestionSetLevelData(learnerDataExists.identifier, updateData);
      } else {
        /**
         * If an entry does not exist for the (learner_id, question_set_id) pair, then we make an entry
         */
        await createLearnerProficiencyQuestionSetLevelData({
          identifier: uuid.v4(),
          learner_id,
          question_set_id: questionSet.identifier,
          taxonomy: questionSet.taxonomy,
          sub_skills: subSkillScores,
          score: avgScore,
          created_by: learner_id,
        });
      }
    }

    /**
     * Updating learner journey
     */
    const start_time = _.get(questionSetTimestampMap, [questionSet.identifier, 'start_time']);
    const end_time = _.get(questionSetTimestampMap, [questionSet.identifier, 'end_time']);
    const { learnerJourney } = await readLearnerJourneyByLearnerIdAndQuestionSetId(learner_id, questionSet.identifier);
    const completedQuestionIds = attemptedQuestions.map((data) => data.question_id);
    if (_.isEmpty(learnerJourney)) {
      const payload = {
        learner_id,
        question_set_id: questionSet.identifier,
        status: allQuestionsHaveEqualNumberOfAttempts ? LearnerJourneyStatus.COMPLETED : LearnerJourneyStatus.IN_PROGRESS,
        completed_question_ids: completedQuestionIds,
      };
      if (start_time) {
        _.set(payload, 'start_time', start_time);
      }
      if (end_time) {
        _.set(payload, 'end_time', end_time);
      }
      await createLearnerJourney(payload);
    } else {
      const payload = {
        status: allQuestionsHaveEqualNumberOfAttempts ? LearnerJourneyStatus.COMPLETED : LearnerJourneyStatus.IN_PROGRESS,
        completed_question_ids: completedQuestionIds,
        attempts_count: allQuestionsHaveEqualNumberOfAttempts ? learnerJourney?.attempts_count + 1 : learnerJourney.attempts_count,
      };
      if (start_time) {
        _.set(payload, 'start_time', start_time);
      }
      if (end_time) {
        _.set(payload, 'end_time', end_time);
      }
      await updateLearnerJourney(learnerJourney.identifier, payload);
    }
  }

  /**
   * Updating grade/skill level data in the following block
   */
  const learnerAttempts = await getQuestionLevelDataRecordsForLearner(learner_id);

  await aggregateLearnerDataOnClassAndSkillLevel(learner, learnerAttempts);

  ResponseHandler.successResponse(req, res, {
    status: httpStatus.OK,
    data: { message: 'Learner data synced successfully' },
  });
};

export default learnerProficiencyDataSync;
