import express from 'express';
import { setDataToRequestObject } from '../../middlewares/setDataToReqObj';
import learnerProficiencyDataRead from '../../controllers/learnerProficiencyData/learnerProficiencyDataRead/learnerProficiencyDataRead';
import learnerProficiencyDataSyncNew from '../../controllers/learnerProficiencyData/learnerProficiencyDataSync/learnerProficiencyDataSyncNew';

const learnerProficiencyRouter = express.Router();

learnerProficiencyRouter.post('/sync', setDataToRequestObject('api.learner.proficiency-data.sync'), learnerProficiencyDataSyncNew);

learnerProficiencyRouter.get('/read/:learner_id', setDataToRequestObject('api.learner.proficiency-data.read'), learnerProficiencyDataRead);

export default learnerProficiencyRouter;
