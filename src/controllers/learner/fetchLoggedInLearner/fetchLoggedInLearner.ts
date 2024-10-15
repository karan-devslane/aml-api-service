import { Request, Response } from 'express';
import { ResponseHandler } from '../../../utils/responseHandler';
import httpStatus from 'http-status';

const fetchLoggedInLearner = (req: Request, res: Response) => {
  const learner = (req as any).learner;

  const result = {
    username: learner!.username,
    identifier: learner!.identifier,
    taxonomy: learner!.taxonomy,
  };

  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: 'Profile fetched successfully', data: result } });
};

export default fetchLoggedInLearner;
