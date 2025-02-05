import { Request, Response } from 'express';
import { ResponseHandler } from '../../utils/responseHandler';
import httpStatus from 'http-status';
import { AudioQuestionMapping } from '../../models/audioQuestionMapping';
import { AudioMaster } from '../../models/audioMaster';
import _ from 'lodash';
import { Question } from '../../models/question';
import { Op } from 'sequelize';
import { createHash } from 'crypto';
import { amlError } from '../../types/amlError';
import { AppDataSource } from '../../config';

const createAudioQuestionMapping = async (req: Request, res: Response) => {
  const audioQuestionMappingEntries = await AudioQuestionMapping.findAll();

  const audioMasterEntries = await AudioMaster.findAll();

  const questionIdLanguageAndAudioIdMapping: { [key: string]: string } = audioQuestionMappingEntries.reduce((agg, curr) => {
    _.set(agg, `${curr.question_id}_${curr.language}`, curr.audio_id);
    return agg;
  }, {});

  const descriptionHashAudioIdMapping = audioMasterEntries.reduce((agg, curr) => {
    _.set(agg, curr.description_hash, curr.identifier);
    return agg;
  }, {});

  const questionsWithAudioDescriptions = await Question.findAll({
    where: {
      question_audio_description: {
        [Op.ne]: null,
      },
    },
  });

  const transaction = await AppDataSource.transaction();

  try {
    for (const question of questionsWithAudioDescriptions) {
      const { question_audio_description } = question;
      for (const data of Object.entries(question_audio_description || {})) {
        const [lang, description] = data;
        if (!description) {
          continue;
        }
        const hash = createHash('md5').update(`${description}-${lang}`.replace(/\s+/g, '').toLowerCase()).digest('hex');
        const audioId = _.get(descriptionHashAudioIdMapping, hash, undefined);
        if (!audioId) {
          const code = 'AUDIO_NOT_FOUND';
          throw amlError(code, `Audio not found for description: ${description}, question_x_id: ${question.x_id}`, 'INTERNAL_SERVER_ERROR', httpStatus.INTERNAL_SERVER_ERROR);
        }
        const mappingExists = _.get(questionIdLanguageAndAudioIdMapping, `${question.identifier}_${lang}`, undefined);
        if (mappingExists && mappingExists === audioId) {
          continue;
        }
        if (!mappingExists) {
          await AudioQuestionMapping.create(
            {
              language: lang,
              audio_id: audioId,
              question_id: question.identifier,
              created_by: 'migration-api',
            },
            { transaction },
          );
        } else if (mappingExists !== audioId) {
          await AudioQuestionMapping.update(
            { audio_id: audioId },
            {
              where: {
                question_id: question.identifier,
                language: lang,
              },
              transaction,
            },
          );
        }
      }
    }
    await transaction.commit();
  } catch (e: any) {
    await transaction.rollback();
    throw new Error(e);
  }

  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { success: true } });
};

export default createAudioQuestionMapping;
