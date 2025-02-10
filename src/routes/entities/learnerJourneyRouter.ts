import express from 'express';
import { setDataToRequestObject } from '../../middlewares/setDataToReqObj';
import learnerJourneyRead from '../../controllers/learnerJourneyData/learnerJourneyRead/learnerJourneyRead';
import leanerJourneyLatestResponseById from '../../controllers/learner/learnerLatestResponses/learnerLatestResponses';

export const learnerJourneyRouter = express.Router();

// learnerJourneyRouter.post('/create', setDataToRequestObject('api.learner.journey.create'), learnerJourneyCreate);

// learnerJourneyRouter.put('/update', setDataToRequestObject('api.learner.journey.update'), learnerJourneyUpdate);

learnerJourneyRouter.get('/read/:learner_id', setDataToRequestObject('api.learner.journey.read'), learnerJourneyRead);

learnerJourneyRouter.get('/latest-responses/:learner_id', setDataToRequestObject('api.learner.journey.latest-responses'), leanerJourneyLatestResponseById);
