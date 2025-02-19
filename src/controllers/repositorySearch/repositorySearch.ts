import { Request, Response } from 'express';
import logger from '../../utils/logger';
import * as _ from 'lodash';
import httpStatus from 'http-status';
import questionSearch from './repositorySearchValidationSchema.json';
import { schemaValidation } from '../../services/validationService';
import { amlError } from '../../types/amlError';
import { ResponseHandler } from '../../utils/responseHandler';
import { repositoryService } from '../../services/repositoryService';

export const apiId = 'api.repository.search';

export const searchRepositories = async (req: Request, res: Response) => {
  const requestBody = _.get(req, 'body');
  const msgid = _.get(req, ['body', 'params', 'msgid']);
  const resmsgid = _.get(res, 'resmsgid');

  const isRequestValid: Record<string, any> = schemaValidation(requestBody, questionSearch);
  if (!isRequestValid.isValid) {
    const code = 'REPOSITORY_INVALID_INPUT';
    logger.error({ code, apiId, msgid, resmsgid, requestBody, message: isRequestValid.message });
    throw amlError(code, isRequestValid.message, 'BAD_REQUEST', 400);
  }

  let questionSetData = await repositoryService.getRepositoryList(requestBody.request);
  questionSetData = _.map(questionSetData, (data: any) => {
    return data?.dataValues;
  });
  logger.info({ apiId, requestBody, message: `Repositories are listed successfully` });
  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: questionSetData });
};
