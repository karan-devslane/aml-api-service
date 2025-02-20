import { Request, Response } from 'express';
import logger from '../../utils/logger';
import * as _ from 'lodash';
import contentSchema from './contentCreateValidationSchema.json';
import httpStatus from 'http-status';

import { schemaValidation } from '../../services/validationService';
import * as uuid from 'uuid';
import { amlError } from '../../types/amlError';
import { ResponseHandler } from '../../utils/responseHandler';
import { createContentData } from '../../services/content';
import { boardService } from '../../services/boardService';
import { SkillType } from '../../enums/skillType';
import { Status } from '../../enums/status';
import { User } from '../../models/users';
import { UserTransformer } from '../../transformers/entity/user.transformer';
import { classService } from '../../services/classService';
import { skillService } from '../../services/skillService';
import { repositoryService } from '../../services/repositoryService';

const createContent = async (req: Request, res: Response) => {
  const apiId = _.get(req, 'id');
  const requestBody = _.get(req, 'body');
  const msgid = _.get(req, ['body', 'params', 'msgid']);
  const dataBody = _.get(req, 'body.request');
  const resmsgid = _.get(res, 'resmsgid');
  const loggedInUser: User | undefined = (req as any).user;

  //validating the schema
  const isRequestValid: Record<string, any> = schemaValidation(requestBody, contentSchema);
  if (!isRequestValid.isValid) {
    const code = 'CONTENT_INVALID_INPUT';
    logger.error({ code, apiId, msgid, resmsgid, requestBody, message: isRequestValid.message });
    throw amlError(code, isRequestValid.message, 'BAD_REQUEST', 400);
  }

  // Check repository
  const repositoryId = dataBody.repository_id;
  const repository = await repositoryService.getRepositoryById(repositoryId);
  if (!repository) {
    const code = 'REPOSITORY_NOT_EXISTS';
    logger.error({ code, apiId, msgid, resmsgid, message: `Repository not exists` });
    throw amlError(code, 'Repository not exists', 'NOT_FOUND', 404);
  }

  // Create the repository object
  const repositoryObject = {
    identifier: repository.identifier,
    name: repository.name,
  };

  // Check board
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

  // Check class
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

  // Check l1_skill and add ID along with the name
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

  // Check l2_skill (assuming it's an array of skills) and add IDs along with names
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

  // Check l3_skill (assuming it's an array of skills) and add IDs along with names
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

  const subSkillObjects: any = [];
  // for (const subSkillId of dataBody.sub_skill_ids || []) {
  //   const subSkill = await getSubSkill(subSkillId);
  //   if (!subSkill) {
  //     const code = 'SUB_SKILL_NOT_EXISTS';
  //     logger.error({ code, message: `Missing sub-skills` });
  //     throw amlError(code, 'sub Skill not exists', 'NOT_FOUND', 404);
  //   }
  //   subSkillObjects.push({
  //     identifier: subSkill.id,
  //     name: subSkill.name,
  //   });
  // }

  //creating a new content
  const contentInsertData = _.assign(dataBody, {
    is_active: true,
    identifier: uuid.v4(),
    status: Status.DRAFT,
    created_by: loggedInUser?.identifier ?? 'manual',
    repository: repositoryObject,
    taxonomy: {
      board: boardObject,
      class: classObject,
      l1_skill: l1SkillObject,
      l2_skill: l2SkillObjects,
      l3_skill: l3SkillObjects,
    },
    sub_skills: subSkillObjects,
  });

  const content = await createContentData(contentInsertData);

  const users = new UserTransformer().transformList([loggedInUser] as User[]);

  logger.info({ apiId, requestBody, message: `Content Created Successfully with identifier` });
  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: 'Content Successfully Created', content, users } });
};

export default createContent;
