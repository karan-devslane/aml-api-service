import { LearnerSession } from '../models/learnerSession';

export const findLearnerSession = async (learnerId: string): Promise<LearnerSession | null> => {
  return LearnerSession.findOne({
    where: {
      sess: { learnerId },
    },
    raw: true,
  });
};

export const destroyLearnerSession = async (sid: string) => {
  await LearnerSession.destroy({
    where: {
      sid,
    },
  });
};
