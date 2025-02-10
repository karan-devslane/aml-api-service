import { Op } from 'sequelize';
import { Learner } from '../models/learner';
import _ from 'lodash';

export const getLearnerByUserName = async (username: string): Promise<Learner | null> => {
  return Learner.findOne({
    where: {
      username,
    },
  });
};

export const getLearnerByIdentifier = async (identifier: string): Promise<Learner | null> => {
  return Learner.findOne({
    where: {
      identifier,
    },
  });
};

export const listLearners = async (): Promise<Learner[]> => {
  return Learner.findAll();
};

export const updateLearner = async (id: number, updatedData: { board_id: string | null; class_id: string | null }) => {
  await Learner.update(updatedData, {
    where: { id },
  });
};

export const getLearnerList = async (req: Record<string, any>) => {
  const limit: any = _.get(req, 'limit');
  const offset: any = _.get(req, 'offset');
  const searchQuery: any = _.get(req, 'search_query');

  const whereClause: any = {};

  if (searchQuery) {
    whereClause.username = { [Op.iLike]: `%${searchQuery}%` };
  }

  const { rows, count } = await Learner.findAndCountAll({
    where: whereClause,
    limit,
    offset,
  });

  return {
    learners: rows,
    meta: {
      offset,
      limit,
      total: count,
    },
  };
};
