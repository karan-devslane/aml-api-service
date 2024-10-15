import { Learner } from '../models/learner';

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
