import { Request, Response } from 'express';
import * as _ from 'lodash';
import { ResponseHandler } from '../../../utils/responseHandler';
import httpStatus from 'http-status';

const fetchMe = (req: Request, res: Response) => {
  const learner = _.get(req, 'learner');

  const result = {
    username: learner!.username,
    identifier: learner!.identifier,
  };

  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: 'Profile fetched successfully', data: result } });
};

export default fetchMe;
