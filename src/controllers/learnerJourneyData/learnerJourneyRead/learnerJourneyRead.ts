import { Request, Response } from 'express';
import * as _ from 'lodash';
import httpStatus from 'http-status';
import { ResponseHandler } from '../../../utils/responseHandler';
import { readLearnerJourney } from '../../../services/learnerJourney';
import logger from '../../../utils/logger';
import { amlError } from '../../../types/amlError';

const apiId = 'api.learner.journey.read';

const learnerJourneyRead = async (req: Request, res: Response) => {
  const learner_id = _.get(req, 'params.learner_id');

  const learner = (req as any).learner;

  if (learner.identifier !== learner_id) {
    const code = 'LEARNER_DOES_NOT_EXIST';
    logger.error({ code, apiId, message: 'Learner does not exist' });
    throw amlError(code, 'Learner does not exist', 'NOT_FOUND', 404);
  }

  const { learnerJourney } = await readLearnerJourney(learner_id);

  if (_.isEmpty(learnerJourney)) {
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: 'Learner Journey not found', data: null } });
  }

  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: 'Learner Journey Read Successfully', data: learnerJourney } });
};

export default learnerJourneyRead;
