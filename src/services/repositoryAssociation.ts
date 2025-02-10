import { Sequelize } from 'sequelize';
import { RepositoryAssociation } from '../models/repositoryAssociations';

export const findRepositoryAssociations = async (data: { learnerId?: string; boardId?: string; tenantId?: string }) => {
  let whereClause: any = {};
  if (data.tenantId) {
    whereClause = {
      tenant_id: data.tenantId,
    };
  }
  if (data.boardId) {
    whereClause = {
      board_id: data.boardId,
    };
  }
  if (data.learnerId) {
    whereClause = {
      learner_id: data.learnerId,
    };
  }
  return RepositoryAssociation.findAll({ where: { ...whereClause, is_active: true }, order: [['sequence', 'asc']] });
};

// get repository identifiers by tenant

export const getRepositoryIds = async (tenantId: string): Promise<string[]> => {
  const repositoryAssociations = await RepositoryAssociation.findAll({
    where: { tenant_id: tenantId, is_active: true },
    attributes: ['repository_id'],
  });

  return repositoryAssociations.map((ra) => ra.repository_id);
};

export const findRepositoryAssociationsByRepositoryId = async (repositoryId: string) => {
  return RepositoryAssociation.findAll({ where: { repository_id: repositoryId, is_active: true }, order: [['sequence', 'asc']] });
};

/**
 * Inserts multiple repository associations into the database.
 */
export const createRepositoryAssociations = async (associations: Partial<RepositoryAssociation>[]): Promise<RepositoryAssociation[]> => {
  return RepositoryAssociation.bulkCreate(associations);
};

export const getMaxSequenceForEntity = async (entityId: string, entityType: 'board' | 'tenant' | 'learner'): Promise<number> => {
  const entityColumn = entityType === 'board' ? 'board_id' : entityType === 'tenant' ? 'tenant_id' : 'learner_id';

  const result = (await RepositoryAssociation.findOne({
    where: {
      [entityColumn]: entityId,
    },
    attributes: [[Sequelize.fn('MAX', Sequelize.col('sequence')), 'maxSequence']],
    raw: true,
  })) as { maxSequence: number } | null;

  return result?.maxSequence ?? 0; // Default to 0 if no records exist
};

export const checkIfAssociationExists = async (repositoryId: string, entityId: string, entityType: 'board' | 'tenant' | 'learner'): Promise<boolean> => {
  const entityColumn = entityType === 'board' ? 'board_id' : entityType === 'tenant' ? 'tenant_id' : 'learner_id';

  const existingAssociation = await RepositoryAssociation.findOne({
    where: {
      repository_id: repositoryId,
      [entityColumn]: entityId,
    },
    raw: true,
  });

  return !!existingAssociation; // Returns true if association exists, false otherwise
};

// Get a single repository by identifier
export const getRepositoryAssociationById = async (id: string, additionalConditions: object = {}) => {
  // Combine base conditions with additional conditions
  const conditions = {
    identifier: id,
    ...additionalConditions,
  };

  return RepositoryAssociation.findOne({
    where: conditions,
    attributes: { exclude: ['id'] },
    raw: true,
  });
};

export const deleteRepositoryAssociationByIdentifier = async (identifier: string): Promise<any> => {
  const repositoryDetails = await RepositoryAssociation.destroy({ where: { identifier } });
  return repositoryDetails;
};
