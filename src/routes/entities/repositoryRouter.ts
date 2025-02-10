import express from 'express';
import { setDataToRequestObject } from '../../middlewares/setDataToReqObj';
import createRepository from '../../controllers/repositoryCreate/repositoryCreate';
import repositoryReadById from '../../controllers/repositoryRead/repositoryRead';
import publishRepository from '../../controllers/repositoryPublish/repositoryPublish';
import repositoryUpdate from '../../controllers/repositoryUpdate/repositoryUpdate';
import deleteRepositoryById from '../../controllers/repositoryDelete/repositoryDelete';
import discardRepositoryById from '../../controllers/repositoryDiscard/repositoryDiscard';
import { searchRepositories } from '../../controllers/repositorySearch/repositorySearch';
import listRepositories from '../../controllers/listRepositories/listRepositories';
import createRepositoryAssociation from '../../controllers/repositoryAssociationsCreate/repositoryAssociationsCreate';
import deleteRepositoryAssociationById from '../../controllers/repositoryAssociationDelete/repositoryAssociationDelete';
import repositoryAssociationsReadByRepositoryId from '../../controllers/repositoryAssociationsRead/repositoryAssociationsRead';

const repositoryRouter = express.Router();

repositoryRouter.post('/create', setDataToRequestObject('api.repository.create'), createRepository);

repositoryRouter.get('/read/:repository_id', setDataToRequestObject('api.repository.read'), repositoryReadById);

repositoryRouter.post('/publish/:repository_id', setDataToRequestObject('api.repository.publish'), publishRepository);

repositoryRouter.post('/update/:repository_id', setDataToRequestObject('api.repository.update'), repositoryUpdate);

repositoryRouter.post('/delete/:repository_id', setDataToRequestObject('api.repository.delete'), deleteRepositoryById);

repositoryRouter.post('/discard/:repository_id', setDataToRequestObject('api.repository.discard'), discardRepositoryById);

repositoryRouter.post('/search', setDataToRequestObject('api.repository.search'), searchRepositories);

repositoryRouter.post('/list', setDataToRequestObject('api.repository.list'), listRepositories);

repositoryRouter.get('/associations/read/:repository_id', setDataToRequestObject('api.repository.associations.read'), repositoryAssociationsReadByRepositoryId);

repositoryRouter.post('/repository-associations', setDataToRequestObject('api.repository.associations.create'), createRepositoryAssociation);

repositoryRouter.post('/delete/repository-associations/:identifier', setDataToRequestObject('api.repository.association.delete'), deleteRepositoryAssociationById);

export default repositoryRouter;
