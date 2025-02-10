import { Request, Response } from 'express';
import logger from '../../utils/logger';
import * as _ from 'lodash';
import { amlError } from '../../types/amlError';
import httpStatus from 'http-status';
import { ResponseHandler } from '../../utils/responseHandler';
import { deleteRepositoryAssociationByIdentifier, getRepositoryAssociationById } from '../../services/repositoryAssociation';

export const apiId = 'api.repository.association.delete';

const deleteRepositoryAssociationById = async (req: Request, res: Response) => {
  const repository_association_id = _.get(req, 'params.identifier');
  const msgid = _.get(req, ['body', 'params', 'msgid']);
  const resmsgid = _.get(res, 'resmsgid');

  // Fetch repository details by identifier
  const repositoryAssociationDetails = await getRepositoryAssociationById(repository_association_id);

  // Validating if repository exists
  if (_.isEmpty(repositoryAssociationDetails)) {
    const code = 'REPOSITORY_ASSOCIATION_NOT_EXISTS';
    logger.error({ code, apiId, msgid, resmsgid, message: `Repository association not exists` });
    throw amlError(code, 'Repository association not exists', 'NOT_FOUND', 404);
  }

  // Delete the repository
  await deleteRepositoryAssociationByIdentifier(repository_association_id);

  logger.info({ apiId, msgid, resmsgid, repository_association_id, message: 'Repository association deleted successfully' });
  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: 'Repository association deleted successfully' } });
};

export default deleteRepositoryAssociationById;
