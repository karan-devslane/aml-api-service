import { Request, Response } from 'express';
import logger from '../../utils/logger';
import * as _ from 'lodash';
import httpStatus from 'http-status';
import { amlError } from '../../types/amlError';
import { ResponseHandler } from '../../utils/responseHandler';
import { repositoryService } from '../../services/repositoryService';

export const apiId = 'api.repository.read';

const repositoryReadById = async (req: Request, res: Response) => {
  const repository_id = _.get(req, 'params.repository_id');
  const msgid = _.get(req, ['body', 'params', 'msgid']);
  const resmsgid = _.get(res, 'resmsgid');

  // Fetch repository details by identifier
  const repositoryDetails = await repositoryService.getRepositoryById(repository_id);

  // Validating if repository exists
  if (_.isEmpty(repositoryDetails)) {
    const code = 'REPOSITORY_NOT_EXISTS';
    logger.error({ code, apiId, msgid, resmsgid, message: `Repository not exists` });
    throw amlError(code, 'Repository not exists', 'NOT_FOUND', 404);
  }

  // Get repository details
  logger.info({ apiId, repository_id, message: `Repository read successfully` });
  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: repositoryDetails });
};

export default repositoryReadById;
