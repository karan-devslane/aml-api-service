import { Request, Response } from 'express';
import logger from '../../utils/logger';
import * as _ from 'lodash';
import httpStatus from 'http-status';
import { getContentById, publishContentById } from '../../services/content';
import { amlError } from '../../types/amlError';
import { Status } from '../../enums/status';
import { ResponseHandler } from '../../utils/responseHandler';
import { User } from '../../models/users';
import { UserTransformer } from '../../transformers/entity/user.transformer';
import { userService } from '../../services/userService';

export const apiId = 'api.content.publish';

const publishContent = async (req: Request, res: Response) => {
  const contentId = _.get(req, 'params.content_id');
  const msgid = _.get(req, ['body', 'params', 'msgid']);
  const resmsgid = _.get(res, 'resmsgid');
  const loggedInUser: User | undefined = (req as any).user;

  // Fetch the content details
  const contentDetails = await getContentById(contentId, { status: Status.DRAFT });

  // Validate content existence
  if (_.isEmpty(contentDetails)) {
    const code = 'CONTENT_NOT_EXISTS';
    logger.error({ code, apiId, msgid, resmsgid, message: `Content not exists` });
    throw amlError(code, 'Content not exists', 'NOT_FOUND', httpStatus.NOT_FOUND);
  }

  // Publish the content
  const [, affectedRows] = await publishContentById(contentId, loggedInUser!.identifier);

  const createdByUser = await userService.getUserByIdentifier(affectedRows?.[0]?.created_by);

  const users = new UserTransformer().transformList(_.uniqBy([createdByUser, loggedInUser], 'identifier').filter((v) => !!v));

  logger.info({ apiId, contentId, message: 'Content published successfully' });
  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { message: 'Content successfully published', content: affectedRows?.[0] ?? {}, users } });
};

export default publishContent;
