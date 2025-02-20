import { Request, Response } from 'express';
import * as _ from 'lodash';
import httpStatus from 'http-status';
import { questionSetService } from '../../services/questionSetService';
import { schemaValidation } from '../../services/validationService';
import logger from '../../utils/logger';
import questionSetUpdateSchema from './questionSetUpdateValidationSchema.json';
import { amlError } from '../../types/amlError';
import { ResponseHandler } from '../../utils/responseHandler';
import { boardService } from '../../services/boardService';
import { SkillType } from '../../enums/skillType';
import { questionService } from '../../services/questionService';
import { QuestionSetPurposeType } from '../../enums/questionSetPurposeType';
import { User } from '../../models/users';
import { getContentById } from '../../services/content';
import { UserTransformer } from '../../transformers/entity/user.transformer';
import { classService } from '../../services/classService';
import { questionSetQuestionMappingService } from '../../services/questionSetQuestionMappingService';
import { QuestionSet } from '../../models/questionSet';
import { Op } from 'sequelize';
import { userService } from '../../services/userService';
import { skillService } from '../../services/skillService';
import { repositoryService } from '../../services/repositoryService';

const updateQuestionSetById = async (req: Request, res: Response) => {
  const apiId = _.get(req, 'id');
  const requestBody = _.get(req, 'body');
  const msgid = _.get(req, ['body', 'params', 'msgid']);
  const questionSet_id = _.get(req, 'params.question_set__id');
  const dataBody = _.get(req, 'body.request');
  const resmsgid = _.get(res, 'resmsgid');
  const loggedInUser: User | undefined = (req as any).user;

  // Validating the update schema
  const isRequestValid: Record<string, any> = schemaValidation(requestBody, questionSetUpdateSchema);
  if (!isRequestValid.isValid) {
    const code = 'QUESTION_SET_INVALID_INPUT';
    logger.error({ code, apiId, msgid, resmsgid, requestBody, message: isRequestValid.message });
    throw amlError(code, isRequestValid.message, 'BAD_REQUEST', 400);
  }

  // Validate question set existence
  const questionSet = await questionSetService.getQuestionSetByIdAndStatus(questionSet_id);

  if (_.isEmpty(questionSet)) {
    const code = 'QUESTION_SET_NOT_EXISTS';
    logger.error({ code, apiId, msgid, resmsgid, message: 'Question Set does not exist' });
    throw amlError(code, 'Question Set does not exist', 'NOT_FOUND', 404);
  }

  // Initialize an updated body
  const updatedDataBody: any = {};

  let moveToLastInSequence = false;
  // Check repository
  if (dataBody.repository_id) {
    const repositoryId = dataBody.repository_id;
    const repository = await repositoryService.getRepositoryById(repositoryId);
    if (!repository) {
      const code = 'REPOSITORY_NOT_EXISTS';
      logger.error({ code, apiId, msgid, resmsgid, message: `Repository not exists` });
      throw amlError(code, 'Repository not exists', 'NOT_FOUND', 404);
    }
    updatedDataBody.repository = {
      identifier: repository.identifier,
      name: repository.name,
    }; // Create repository object
    moveToLastInSequence = questionSet?.repository.identifier !== dataBody.repository_id;
  }

  const mappingPromises1 = [];
  const mappingPromises2 = [];
  const questionIdentifierSequenceMap = {};
  for (const question of dataBody.questions || []) {
    const { identifier, sequence } = question;
    _.set(questionIdentifierSequenceMap, identifier, sequence);
  }

  const questionIdentifiers = Object.keys(questionIdentifierSequenceMap);
  const { exists: questionsExist } = await questionService.checkQuestionsExist(questionIdentifiers);

  if (!questionsExist) {
    const code = 'QUESTIONS_NOT_FOUND';
    logger.error({ code, apiId, msgid, resmsgid, message: 'Some questions were not found' });
    throw amlError(code, 'Some questions were not found', 'NOT_FOUND', 404);
  }

  const mappings = await questionSetQuestionMappingService.getEntriesForQuestionSetId(questionSet_id);
  const existingQuestionIds = mappings.map((map) => map.question_id);
  const removedQuestionIds = _.difference(existingQuestionIds, questionIdentifiers);
  const addedQuestionIds = _.difference(questionIdentifiers, existingQuestionIds);

  for (const mapping of mappings) {
    const { question_id } = mapping;
    if (removedQuestionIds.includes(question_id)) {
      mappingPromises1.push(questionSetQuestionMappingService.updateById(mapping.id, { updated_by: loggedInUser?.identifier || 'manual' }));
      mappingPromises2.push(questionSetQuestionMappingService.destroyById(mapping.id));
    } else {
      mappingPromises1.push(
        questionSetQuestionMappingService.updateById(mapping.id, { sequence: _.get(questionIdentifierSequenceMap, question_id), updated_by: loggedInUser?.identifier || 'manual' }),
      );
    }
  }
  for (const questionId of addedQuestionIds) {
    mappingPromises1.push(
      questionSetQuestionMappingService.create({
        question_set_id: questionSet_id,
        question_id: questionId,
        sequence: _.get(questionIdentifierSequenceMap, questionId),
        created_by: loggedInUser?.identifier || 'manual',
      }),
    );
  }

  // Check board
  if (dataBody.board_id) {
    const boardId = dataBody.board_id;
    const board = await boardService.getBoardByIdentifier(boardId);
    if (!board) {
      const code = 'BOARD_NOT_EXISTS';
      logger.error({ code, apiId, msgid, resmsgid, message: `Board not exists` });
      throw amlError(code, 'Board not exists', 'NOT_FOUND', 404);
    }

    const boardObject = {
      identifier: board.identifier,
      name: board.name,
    };
    updatedDataBody.taxonomy = { ...updatedDataBody.taxonomy, board: boardObject }; // Create board object
    moveToLastInSequence = questionSet?.taxonomy.board.identifier !== dataBody.board_id;
  }

  // Check class
  if (dataBody.class_id) {
    const classId = dataBody.class_id;
    const classEntity = await classService.getClassById(classId);
    if (!classEntity) {
      const code = 'CLASS_NOT_EXISTS';
      logger.error({ code, apiId, msgid, resmsgid, message: `Class not exists` });
      throw amlError(code, 'Class not exists', 'NOT_FOUND', 404);
    }

    const classObject = {
      identifier: classEntity.identifier,
      name: classEntity.name,
    };
    updatedDataBody.taxonomy = { ...updatedDataBody.taxonomy, class: classObject }; // Create class object
    moveToLastInSequence = questionSet?.taxonomy.class.identifier !== dataBody.class_id;
  }

  // Check l1_skill
  if (dataBody.l1_skill_id) {
    const l1Skill = await skillService.getSkillById(dataBody.l1_skill_id);
    if (!l1Skill || l1Skill.type !== SkillType.L1_SKILL) {
      const code = 'L1_SKILL_NOT_EXISTS';
      logger.error({ code, message: `L1 Skill not exists` });
      throw amlError(code, 'L1 Skill not exists', 'NOT_FOUND', 404);
    }

    const l1SkillObject = {
      identifier: l1Skill.identifier,
      name: l1Skill.name,
    };
    updatedDataBody.taxonomy = { ...updatedDataBody.taxonomy, l1_skill: l1SkillObject }; // Create l1_skill object
    moveToLastInSequence = questionSet?.taxonomy.l1_skill.identifier !== dataBody.l1_skill_id;
  }

  // Check l2_skill
  if (dataBody.l2_skill_ids) {
    const l2SkillObjects = [];
    for (const l2SkillId of dataBody.l2_skill_ids || []) {
      const l2Skill = await skillService.getSkillById(l2SkillId);
      if (!l2Skill || l2Skill.type !== SkillType.L2_SKILL) {
        const code = 'L2_SKILL_NOT_EXISTS';
        logger.error({ code, message: `L2 Skill not exists` });
        throw amlError(code, 'L2 Skill not exists', 'NOT_FOUND', 404);
      }
      l2SkillObjects.push({
        identifier: l2Skill.identifier,
        name: l2Skill.name,
      });
    }
    updatedDataBody.taxonomy = { ...updatedDataBody.taxonomy, l2_skill: l2SkillObjects }; // Create l2_skill objects
  }

  // Check l3_skill
  if (dataBody.l3_skill_ids) {
    const l3SkillObjects = [];
    for (const l3SkillId of dataBody.l3_skill_ids || []) {
      const l3Skill = await skillService.getSkillById(l3SkillId);
      if (!l3Skill || l3Skill.type !== SkillType.L3_SKILL) {
        const code = 'L3_SKILL_NOT_EXISTS';
        logger.error({ code, message: `L3 Skill not exists` });
        throw amlError(code, 'L3 Skill not exists', 'NOT_FOUND', 404);
      }
      l3SkillObjects.push({
        identifier: l3Skill.identifier,
        name: l3Skill.name,
      });
    }
    updatedDataBody.taxonomy = { ...updatedDataBody.taxonomy, l3_skill: l3SkillObjects }; // Create l3_skill objects
  }

  // Validate sub_skills
  // if (dataBody.sub_skills_ids) {
  //   const subSkillObjects = [];
  //   for (const subSkillId of dataBody.sub_skill_ids || []) {
  //     const subSkill = await getSubSkill(subSkillId);
  //     if (!subSkill) {
  //       const code = 'SUB_SKILL_NOT_EXISTS';
  //       logger.error({ code, message: `Missing sub-skills` });
  //       throw amlError(code, 'sub Skill not exists', 'NOT_FOUND', 404);
  //     }
  //     subSkillObjects.push({
  //       identifier: subSkill.identifier,
  //       name: subSkill.name,
  //     });
  //   }
  //   updatedDataBody.sub_skills = subSkillObjects; // Add found sub-skills
  // }

  // Validate sub_skills
  if (dataBody.content_ids) {
    const contentIds = [];
    for (const contentId of dataBody.content_ids || []) {
      const content = await getContentById(contentId);
      if (!content) {
        const code = 'CONTENT_DOES_NOT_EXISTS';
        logger.error({ code, message: `Missing content` });
        throw amlError(code, 'Content does not exists', 'NOT_FOUND', 404);
      }
      contentIds.push(content.identifier);
    }
    updatedDataBody.content_ids = contentIds; // Add found contentIds
  }

  if (Object.prototype.hasOwnProperty.call(dataBody, 'enable_feedback')) {
    const purpose = dataBody?.purpose ?? questionSet?.purpose;
    updatedDataBody.enable_feedback = purpose === QuestionSetPurposeType.MAIN_DIAGNOSTIC ? false : dataBody?.enable_feedback;
  }

  const questionSetUpdatePromises: any[] = [];
  let sequence = questionSet.sequence;
  if (Object.prototype.hasOwnProperty.call(dataBody, 'sequence') && dataBody.sequence !== questionSet.sequence && !moveToLastInSequence) {
    const operation = dataBody.sequence < questionSet.sequence ? 'increment' : 'decrement';
    let sequenceWhereClause: any = {
      [Op.and]: {
        [Op.gt]: questionSet.sequence,
        [Op.lte]: dataBody.sequence,
      },
    };

    if (operation === 'increment') {
      sequenceWhereClause = {
        [Op.and]: {
          [Op.gte]: dataBody.sequence,
          [Op.lt]: questionSet.sequence,
        },
      };
    }
    const questionSetsToBeUpdated = await QuestionSet.findAll({
      where: {
        taxonomy: {
          board: {
            identifier: questionSet?.taxonomy.board.identifier,
          },
          class: {
            identifier: questionSet?.taxonomy.class.identifier,
          },
          l1_skill: {
            identifier: questionSet?.taxonomy.l1_skill.identifier,
          },
        },
        repository: {
          identifier: questionSet?.repository.identifier,
        },
        sequence: sequenceWhereClause,
      },
    });
    for (const questionSetToBeUpdated of questionSetsToBeUpdated) {
      questionSetUpdatePromises.push(questionSetToBeUpdated.update({ sequence: operation === 'increment' ? questionSetToBeUpdated.sequence + 1 : questionSetToBeUpdated.sequence - 1 }));
    }
    sequence = dataBody.sequence;
  } else if (moveToLastInSequence) {
    const boardId = dataBody?.board_id ?? questionSet?.taxonomy?.board.identifier;
    const classId = dataBody?.class_id ?? questionSet?.taxonomy?.class.identifier;
    const l1SkillId = dataBody?.l1_skill_id ?? questionSet?.taxonomy?.l1_skill.identifier;
    const repositoryId = dataBody?.repository_id ?? questionSet?.repository?.identifier;
    sequence = await questionSetService.getNextSetSequence({
      board_id: boardId,
      class_id: classId,
      l1_skill_id: l1SkillId,
      repository_id: repositoryId,
    });
  }

  updatedDataBody.sequence = sequence;
  updatedDataBody.updated_by = loggedInUser?.identifier ?? 'manual';

  // Update Question Set
  const [, affectedRows] = await questionSetService.updateQuestionSet(questionSet_id, { ...dataBody, ...updatedDataBody });
  await Promise.all(mappingPromises1);
  await Promise.all(mappingPromises2);
  await Promise.all(questionSetUpdatePromises);

  const createdByUser = await userService.getUserByIdentifier(affectedRows?.[0]?.created_by);

  const users = new UserTransformer().transformList(_.uniqBy([createdByUser, loggedInUser], 'identifier').filter((v) => !!v));

  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: 'Question Set Successfully Updated', question_set: affectedRows?.[0] ?? {}, users } });
};

export default updateQuestionSetById;
