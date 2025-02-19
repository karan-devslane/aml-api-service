import { Request, Response } from 'express';
import _ from 'lodash';
import { amlError } from '../../types/amlError';
import { getCSVEntries } from './helper';
import { AppDataSource } from '../../config';
import { ResponseHandler } from '../../utils/responseHandler';
import httpStatus from 'http-status';
import { QuestionOperation } from '../../enums/questionOperation';
import { subTopicService } from '../../services/subTopicService';
import { QuestionType } from '../../enums/questionType';
import { accuracyThresholdService } from '../../services/accuracyThresholdService';

const initializeAccuracyThresholdsTable = async (req: Request, res: Response) => {
  const csvFile = _.get(req, ['files', 'document'], {});

  if (!csvFile) {
    const code = 'UPLOAD_INVALID_INPUT';
    throw amlError(code, 'document missing', 'BAD_REQUEST', 400);
  }
  const rows = getCSVEntries(csvFile);
  const transaction = await AppDataSource.transaction();

  const subTopicMap = {};

  try {
    for (const row of rows.slice(1)) {
      const [topic, subTopic, questionType, threshold, retryQuestionCount] = row;

      if (!Object.values(QuestionOperation).includes(topic as QuestionOperation)) {
        const code = 'INVALID_TOPIC';
        throw amlError(code, `Invalid topic ${topic}`, 'BAD_REQUEST', 400);
      }

      let subTopicIdentifier = _.get(subTopicMap, subTopic);
      if (!subTopicIdentifier) {
        const subTopicExists = await subTopicService.findByName(subTopic);
        if (!subTopicExists) {
          const code = 'INVALID_SUB_TOPIC';
          throw amlError(code, `Invalid sub_topic ${subTopic}`, 'BAD_REQUEST', 400);
        } else {
          subTopicIdentifier = subTopicExists.identifier;
        }
        _.set(subTopicMap, subTopic, subTopicIdentifier);
      }

      if (!Object.values(QuestionType).includes(questionType as QuestionType)) {
        const code = 'INVALID_QUESTION_TYPE';
        throw amlError(code, `Invalid QuestionType ${questionType}`, 'BAD_REQUEST', 400);
      }

      if (Number.isNaN(+threshold)) {
        const code = 'INVALID_THRESHOLD';
        throw amlError(code, `Invalid threshold value: ${threshold}`, 'BAD_REQUEST', 400);
      }

      if (retryQuestionCount && Number.isNaN(+retryQuestionCount)) {
        const code = 'INVALID_RETRY_QUESTION_COUNT';
        throw amlError(code, `Invalid retryQuestionCount value: ${retryQuestionCount}`, 'BAD_REQUEST', 400);
      }

      await accuracyThresholdService.create(
        {
          topic,
          sub_topic_id: subTopicIdentifier,
          question_type: questionType,
          threshold: +threshold,
          retry_question_count: retryQuestionCount ? +retryQuestionCount : null,
          created_by: 'migration-api',
        },
        transaction,
      );
    }
    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    throw e;
  }

  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { success: true } });
};

export default initializeAccuracyThresholdsTable;
