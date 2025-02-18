import { Request, Response } from 'express';
import logger from '../../utils/logger';
import * as _ from 'lodash';
import * as uuid from 'uuid';
import httpStatus from 'http-status';
import { schemaValidation } from '../../services/validationService';
import { amlError } from '../../types/amlError';
import { ResponseHandler } from '../../utils/responseHandler';
import repositoryAssociationsCreateValidationSchema from './repositoryAssociationsCreateValidationSchema.json';
import { User } from '../../models/users';
import { checkIfAssociationExists, createRepositoryAssociations, getMaxSequenceForEntity } from '../../services/repositoryAssociation';
import { getRepositoryById } from '../../services/repository';
import { boardService } from '../../services/boardService';
import { tenantService } from '../../services/tenantService';
import { learnerService } from '../../services/learnerService';

export const apiId = 'api.repository.associations.create';

const createRepositoryAssociation = async (req: Request, res: Response) => {
  const requestBody = _.get(req, 'body');
  const msgid = _.get(req, ['body', 'params', 'msgid']);
  const dataBody = _.get(req, 'body.request');
  const resmsgid = _.get(res, 'resmsgid');
  const loggedInUser: User | undefined = (req as any).user;

  // Validate request schema
  const isRequestValid = schemaValidation(requestBody, repositoryAssociationsCreateValidationSchema);
  if (!isRequestValid.isValid) {
    const code = 'REPOSITORY_ASSOCIATIONS_INVALID_INPUT';
    logger.error({ code, apiId, msgid, resmsgid, requestBody, message: isRequestValid.message });
    throw amlError(code, isRequestValid.message, 'BAD_REQUEST', 400);
  }

  const repositoryId = dataBody.repository_id;
  const createdBy = loggedInUser?.identifier ?? 'manual';

  // Determining entity type and map to respective columns
  let entityType: 'board' | 'learner' | 'tenant' | null = null;
  let entityIds: string[] = [];

  if (dataBody.board_ids) {
    entityType = 'board';
    entityIds = dataBody.board_ids;
  } else if (dataBody.learner_ids) {
    entityType = 'learner';
    entityIds = dataBody.learner_ids;
  } else if (dataBody.tenant_ids) {
    entityType = 'tenant';
    entityIds = dataBody.tenant_ids;
  }

  // Ensure entity type is valid
  if (!entityType || entityIds.length === 0) {
    throw amlError('REPOSITORY_ASSOCIATIONS_MISSING_ENTITY', 'No valid entity IDs provided', 'BAD_REQUEST', 400);
  }
  // Getting the current max sequence number for the repository and entity type
  const repositoryAssociationsData = [];

  for (const id of entityIds) {
    // Check if association already exists
    const associationExists = await checkIfAssociationExists(repositoryId, id, entityType);
    if (associationExists) {
      throw amlError('REPOSITORY_ASSOCIATION_EXISTS', `Association for ${entityType} ID already exists in repository`, 'BAD_REQUEST', 400);
    }

    // Get max sequence for this entity across all repositories
    const maxSequence = await getMaxSequenceForEntity(id, entityType);
    const newSequence = maxSequence + 1;

    repositoryAssociationsData.push({
      repository_id: repositoryId,
      [entityType === 'board' ? 'board_id' : entityType === 'tenant' ? 'tenant_id' : 'learner_id']: id,
      sequence: newSequence,
      is_active: true,
      created_by: createdBy,
      created_at: new Date(),
      identifier: uuid.v4(),
    });
  }

  // Insert into database
  const associations = await createRepositoryAssociations(repositoryAssociationsData);
  logger.info({ apiId, requestBody, message: `Repository associations created successfully.` });

  // Extract unique IDs
  const repositoryIds = _.uniq(associations.map((assoc) => assoc.repository_id));
  const boardIds = _.uniq(associations.map((assoc) => assoc.board_id).filter((id) => id));
  const tenantIds = _.uniq(associations.map((assoc) => assoc.tenant_id).filter((id) => id));
  const learnerIds = _.uniq(associations.map((assoc) => assoc.learner_id).filter((id) => id));

  // Fetch related entities
  const repositories = repositoryIds?.length ? await Promise.all(repositoryIds.map((id) => getRepositoryById(id))) : [];
  const boards = boardIds?.length ? await Promise.all(boardIds.map((id: any) => boardService.getBoardByIdentifier(id))) : [];
  const tenants = tenantIds?.length ? await Promise.all(tenantIds.map((id: any) => tenantService.getTenant(id))) : [];
  const learners = learnerIds?.length ? await Promise.all(learnerIds.map((id: any) => learnerService.getLearnerByIdentifier(id))) : [];

  const responseData = {
    repository_associations: associations,
    repositories,
    boards,
    tenants,
    learners,
    message: 'Repository Associations Successfully Created',
    repository_id: repositoryId,
  };

  ResponseHandler.successResponse(req, res, {
    status: httpStatus.OK,
    data: responseData,
  });
};

export default createRepositoryAssociation;
