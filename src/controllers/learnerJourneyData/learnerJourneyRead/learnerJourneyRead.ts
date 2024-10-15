import { Request, Response } from 'express';
import * as _ from 'lodash';
import httpStatus from 'http-status';
import { ResponseHandler } from '../../../utils/responseHandler';
import { readLearnerJourney } from '../../../services/learnerJourney';

export const apiId = 'api.learner.journey.read';

const learnerJourneyRead = async (req: Request, res: Response) => {
  const learner_id = _.get(req, 'params.learner_id');

  // TODO: validate learner_id

  const { learnerJourney } = await readLearnerJourney(learner_id);

  if (_.isEmpty(learnerJourney)) {
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: 'Learner Journey not found', data: null } });
  }

  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: 'Learner Journey Read Successfully', data: learnerJourney } });
};

export default learnerJourneyRead;
