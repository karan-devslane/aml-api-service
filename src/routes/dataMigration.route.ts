import express from 'express';
import { learnerTaxonomyToColumns } from '../controllers/dataMigrations/learnerTaxonomyToColumns';
import createQuestionSetQuestionMapping from '../controllers/dataMigrations/createQuestionSetQuestionMapping';
import updateQuestionSetXId from '../controllers/dataMigrations/updateQuestionSetXId';
import standardiseMediaKeys from '../controllers/dataMigrations/standardiseMediaKeys';
import updateGrid1MetaData from '../controllers/dataMigrations/updateGrid1MetaData';
import createSections from '../controllers/dataMigrations/createSections';
import updateLearnerNamesAndSchool from '../controllers/dataMigrations/updateLearnerNamesAndSchool';
import updateQuestionAudioDescription from '../controllers/dataMigrations/updateQuestionAudioDescription';
import generateAudioForDescriptions from '../controllers/dataMigrations/generateAudioForDescriptions';
import createAudioQuestionMapping from '../controllers/dataMigrations/createAudioQuestionMapping';
import initializeQuestionMetaTable from '../controllers/dataMigrations/initializeQuestionMetaTable';
import initializeSubTopicHierarchyTable from '../controllers/dataMigrations/initializeSubTopicHierarchyTable';
import initializeSubTopicNQLTypeTable from '../controllers/dataMigrations/initializeSubTopicNQLTypeTable';
import initializeAccuracyThresholdsTable from '../controllers/dataMigrations/initializeAccuracyThresholdsTable';
import initializeSubTopicMasterTable from '../controllers/dataMigrations/initializeSubTopicMasterTable';

export const dataMigrations = express.Router();

dataMigrations.post('/learner-taxonomy-to-columns', learnerTaxonomyToColumns);

dataMigrations.post('/question-set-question-mapping', createQuestionSetQuestionMapping);

dataMigrations.post('/update-qs-x_id', updateQuestionSetXId);

dataMigrations.post('/media-keys-fix', standardiseMediaKeys);

dataMigrations.post('/grid-1-metadata', updateGrid1MetaData);

dataMigrations.post('/create-sections', createSections);

dataMigrations.post('/update-learner-names-and-school', updateLearnerNamesAndSchool);

dataMigrations.post('/update-audio-description', updateQuestionAudioDescription);

dataMigrations.post('/generate-audio-for-descriptions', generateAudioForDescriptions);

dataMigrations.post('/create-audio-question-mapping', createAudioQuestionMapping);

dataMigrations.post('/initialize-question-meta-table', initializeQuestionMetaTable);

dataMigrations.post('/initialize-sub-topic-master-table', initializeSubTopicMasterTable);

dataMigrations.post('/initialize-sub-topic-hierarchy-table', initializeSubTopicHierarchyTable);

dataMigrations.post('/initialize-sub-topic-nql-type-table', initializeSubTopicNQLTypeTable);

dataMigrations.post('/initialize-accuracy-thresholds-table', initializeAccuracyThresholdsTable);
