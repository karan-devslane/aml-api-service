import { Request, Response } from 'express';
import logger from '../../utils/logger';
import * as _ from 'lodash';
import httpStatus from 'http-status';
import { ResponseHandler } from '../../utils/responseHandler';
import { findRepositoryAssociationsByRepositoryId } from '../../services/repositoryAssociation';
import { getRepositoryById } from '../../services/repository';
import { boardService } from '../../services/boardService';
import { tenantService } from '../../services/tenantService';
import { getLearnerByIdentifier } from '../../services/learner';

export const apiId = 'api.repository.read';

const repositoryAssociationsReadByRepositoryId = async (req: Request, res: Response) => {
  const repository_id = _.get(req, 'params.repository_id');

  // Fetch repository details by identifier
  const repositoryAssociations = await findRepositoryAssociationsByRepositoryId(repository_id);

  // Extract unique IDs
  const repositoryIds = _.uniq(repositoryAssociations.map((assoc) => assoc.repository_id));
  const boardIds = _.uniq(repositoryAssociations.map((assoc) => assoc.board_id).filter((id) => id));
  const tenantIds = _.uniq(repositoryAssociations.map((assoc) => assoc.tenant_id).filter((id) => id));
  const learnerIds = _.uniq(repositoryAssociations.map((assoc) => assoc.learner_id).filter((id) => id));

  // Fetch related entities
  const repositories = repositoryIds?.length ? await Promise.all(repositoryIds.map((id) => getRepositoryById(id))) : [];
  const boards = boardIds?.length ? await Promise.all(boardIds.map((id: any) => boardService.getBoardByIdentifier(id))) : [];
  const tenants = tenantIds?.length ? await Promise.all(tenantIds.map((id: any) => tenantService.getTenant(id))) : [];
  const learners = learnerIds?.length ? await Promise.all(learnerIds.map((id: any) => getLearnerByIdentifier(id))) : [];

  const responseData = {
    repository_associations: repositoryAssociations,
    repositories,
    boards,
    tenants,
    learners,
  };
  // Get repository details
  logger.info({ apiId, repository_id, message: `Repository associations read successfully` });
  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: responseData });
};

export default repositoryAssociationsReadByRepositoryId;
