import { Request, Response } from 'express';
import { ResponseHandler } from '../../utils/responseHandler';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import { amlError } from '../../types/amlError';
import { getCSVEntries } from './helper';
import { AppDataSource } from '../../config';
import { Question } from '../../models/question';

const updateQuestionAudioDescription = async (req: Request, res: Response) => {
  const csvFile = _.get(req, ['files', 'document'], {});
  if (!csvFile) {
    const code = 'UPLOAD_INVALID_INPUT';
    throw amlError(code, 'document missing', 'BAD_REQUEST', 400);
  }

  const rows = getCSVEntries(csvFile);
  const headerRow = rows[0];
  const dataRows = rows.slice(1);

  const audioTextFieldIndices = headerRow.map((field, index) => (field.startsWith('audio_text_') ? index : -1)).filter((v) => v >= 0);
  const questionXIDHeaderIndex = headerRow.findIndex((field) => field === 'QID');

  const updateMap: any = {};

  for (const row of dataRows) {
    const xId = row[questionXIDHeaderIndex];
    if (!Object.prototype.hasOwnProperty.call(updateMap, xId)) {
      const data = audioTextFieldIndices.reduce((agg, curr) => {
        const headerName = headerRow[curr];
        const language = headerName.split('_text_')[1];
        const description = row[curr];
        _.set(agg, language, description);
        return agg;
      }, {});
      _.set(updateMap, xId, data);
    }
  }

  const transaction = await AppDataSource.transaction();

  try {
    for (const entry of Object.entries(updateMap)) {
      const [xId, updateData] = entry;
      await Question.update(
        {
          question_audio_description: updateData,
        },
        {
          where: {
            x_id: xId,
          },
        },
      );
    }
    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    throw Error('Something went wrong');
  }

  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { success: true } });
};

export default updateQuestionAudioDescription;
