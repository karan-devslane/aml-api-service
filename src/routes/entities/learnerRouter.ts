import express from 'express';
import { learnerJourneyRouter } from './learnerJourneyRouter';
import learnerProficiencyRouter from './learnerProficiencyRouter';
import evaluateLearner from '../../controllers/learner/learnerNextStep/evaluateLearner';
import { setDataToRequestObject } from '../../middlewares/setDataToReqObj';
import { learnerAuth } from '../../middlewares/learnerAuth';
import fetchLoggedInLearner from '../../controllers/learner/fetchLoggedInLearner/fetchLoggedInLearner';
import listLearners from '../../controllers/learnerSearch/learnerSearch';

export const learnerRouter = express.Router();

learnerRouter.use('/journey', learnerJourneyRouter);

learnerRouter.use('/proficiency-data', learnerProficiencyRouter);

learnerRouter.post('/evaluate/:learner_id', learnerAuth, evaluateLearner);

learnerRouter.get('/read', setDataToRequestObject('api.learner.read'), learnerAuth, fetchLoggedInLearner);

learnerRouter.post('/list', setDataToRequestObject('api.learner.list'), listLearners);
