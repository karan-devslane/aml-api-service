import express from 'express';
import { learnerJourneyRouter } from './learnerJourneyRouter';
import learnerProficiencyRouter from './learnerProficiencyRouter';
import evaluateLearner from '../../controllers/learner/learnerNextStep/evaluateLearner';

export const learnerRouter = express.Router();

learnerRouter.use('/journey', learnerJourneyRouter);

learnerRouter.use('/proficiency-data', learnerProficiencyRouter);

learnerRouter.get('/evaluate/:learner_id', evaluateLearner);
