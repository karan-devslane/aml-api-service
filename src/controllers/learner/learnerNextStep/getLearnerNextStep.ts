import { Request, Response } from 'express';
import * as _ from 'lodash';
import httpStatus from 'http-status';
import { ResponseHandler } from '../../../utils/responseHandler';
import logger from '../../../utils/logger';
import { amlError } from '../../../types/amlError';
import { apiId } from '../../LearnerJourneyUpdate/learnerJourneyUpdate';
import { getEntitySearch } from '../../../services/master';
import { readLearnerJourney, readLearnerJourneyByLearnerIdAndQuestionSetId } from '../../../services/learnerJourney';
import { LearnerJourneyStatus } from '../../../enums/learnerJourneyStatus';
import { getMainDiagnosticQuestionSet, getNextPracticeQuestionSetInSequence, getPracticeQuestionSet, getQuestionSetById } from '../../../services/questionSet';
import { findAggregateData } from '../../../services/learnerAggregateData';
import { PASSING_MARKS } from '../../../constants/constants';
import { QuestionSetPurposeType } from '../../../enums/questionSetPurposeType';

const getLearnerNextStep = async (req: Request, res: Response) => {
  const learner_id = _.get(req, 'params.learner_id');
  const msgid = _.get(req, ['body', 'params', 'msgid']);
  const resmsgid = _.get(res, 'resmsgid');

  // TODO: validate learner_id & get their board & class

  const { learnerJourney } = await readLearnerJourney(learner_id);

  /**
   * Check if learner is attempting a question_set
   */
  if (learnerJourney) {
    if (learnerJourney.status === LearnerJourneyStatus.IN_PROGRESS) {
      const code = 'LEARNER_JOURNEY_IN_PROGRESS';
      logger.error({ code, apiId, msgid, resmsgid, message: `Learner Journey already in progress` });
      throw amlError(code, `Learner Journey already in progress`, 'BAD_REQUEST', 400);
    }

    const learnerJourneyQuestionSet = await getQuestionSetById(learnerJourney?.question_set_id);
    if (learnerJourneyQuestionSet.purpose !== QuestionSetPurposeType.MAIN_DIAGNOSTIC) {
      const nextPracticeQuestionSet = await getNextPracticeQuestionSetInSequence({
        board: learnerJourneyQuestionSet.taxonomy.board,
        class: learnerJourneyQuestionSet.taxonomy.class,
        l1Skill: learnerJourneyQuestionSet.taxonomy.l1_skill,
        lastSetSequence: learnerJourneyQuestionSet.sequence,
      });

      if (nextPracticeQuestionSet) {
        ResponseHandler.successResponse(req, res, {
          status: httpStatus.OK,
          data: { message: 'Learner next step fetched successfully', data: { question_set_id: nextPracticeQuestionSet.identifier } },
        });
      }
    }
  }

  // TODO: replace with valid values
  const learnerBoard = 'CBSE';
  const learnerClass = 'Class 5';

  /**
   * Validate learner board
   */
  const boardEntity = await getEntitySearch({ entityType: 'board', filters: { name: [{ en: learnerBoard }] } });
  if (!boardEntity) {
    const code = 'LEARNER_BOARD_NOT_FOUND';
    logger.error({ code, apiId, msgid, resmsgid, message: `Learner Board: ${learnerBoard} does not exist` });
    throw amlError(code, `Learner Board: ${learnerBoard} does not exist`, 'NOT_FOUND', 404);
  }

  /**
   * Validate learner class
   */
  const classEntity = await getEntitySearch({ entityType: 'class', filters: { name: [{ en: learnerBoard }] } });
  if (!classEntity) {
    const code = 'LEARNER_CLASS_NOT_FOUND';
    logger.error({ code, apiId, msgid, resmsgid, message: `Learner Class: ${learnerClass} does not exist` });
    throw amlError(code, `Learner Class: ${learnerClass} does not exist`, 'NOT_FOUND', 404);
  }

  // TODO: Pick these from class-skill mapping in boardEntity
  const highestApplicableGrade = 'Class 4';
  const requiredL1Skills = ['Addition', 'Subtraction'];

  let questionSetId: string = '';
  for (const skill of requiredL1Skills) {
    const mainDiagnosticQS = await getMainDiagnosticQuestionSet({ board: learnerBoard, class: highestApplicableGrade, l1Skill: skill });
    const { learnerJourney: learnerJourneyForMDQS } = await readLearnerJourneyByLearnerIdAndQuestionSetId(learner_id, mainDiagnosticQS.identifier);
    if (_.isEmpty(learnerJourneyForMDQS)) {
      questionSetId = mainDiagnosticQS.identifier;
      break;
    }

    // TODO: Pick these from class-skill mapping in boardEntity on the basis of current skill
    const allApplicableGrades = ['Class 1', 'Class 2', 'Class 3', 'Class 4'];

    // CLASS LEVEL SCORE CHECK
    let lowestApplicableGradeForPractice = '';
    for (const grade of allApplicableGrades) {
      const learnerAggregateData = await findAggregateData({ learner_id, class: grade });
      if (learnerAggregateData && learnerAggregateData?.score < PASSING_MARKS) {
        lowestApplicableGradeForPractice = grade;
        break;
      }
    }

    const practiceQuestionSet = await getPracticeQuestionSet({ board: learnerBoard, class: lowestApplicableGradeForPractice, l1Skill: skill, idNotIn: [] });

    if (practiceQuestionSet) {
      questionSetId = practiceQuestionSet.identifier;
    }
  }

  ResponseHandler.successResponse(req, res, {
    status: httpStatus.OK,
    data: { message: questionSetId ? 'Learner next step fetched successfully' : 'No more practice questions available', data: { question_set_id: questionSetId ?? '' } },
  });
};

export default getLearnerNextStep;
