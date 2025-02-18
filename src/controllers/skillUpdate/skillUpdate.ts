import { Request, Response } from 'express';
import * as _ from 'lodash';
import httpStatus from 'http-status';
import { schemaValidation } from '../../services/validationService';
import skillUpdateSchema from './updateSkillValidationSchema.json';
import logger from '../../utils/logger';
import { amlError } from '../../types/amlError';
import { ResponseHandler } from '../../utils/responseHandler';
import { skillService } from '../../services/skillService';

export const apiId = 'api.skill.update';

//Function for the skill update
const updateSkill = async (req: Request, res: Response) => {
  const requestBody = _.get(req, 'body');
  const msgid = _.get(req, ['body', 'params', 'msgid']);
  const resmsgid = _.get(res, 'resmsgid');
  const skillId = _.get(req, 'params.skill_id');
  const dataBody = _.get(req, 'body.request');

  // Validate the request body against the schema
  const isRequestValid = schemaValidation(requestBody, skillUpdateSchema);
  if (!isRequestValid.isValid) {
    const code = 'SKILL_INVALID_INPUT';
    logger.error({ code, apiId, msgid, resmsgid, requestBody, message: isRequestValid.message });
    throw amlError(code, isRequestValid.message, 'BAD_REQUEST', 400);
  }

  // Check if the skill exists
  const skill = await skillService.getSkillById(skillId);
  if (_.isEmpty(skill)) {
    const code = 'SKILL_NOT_EXISTS';
    logger.error({ code, apiId, msgid, resmsgid, message: 'Skill does not exist' });
    throw amlError(code, 'Skill does not exist', 'NOT_FOUND', 404);
  }

  // Update the skill
  await skillService.updateSkillData(skillId, dataBody);

  // Return a success response
  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: 'Skill Successfully Updated' } });
};

export default updateSkill;
