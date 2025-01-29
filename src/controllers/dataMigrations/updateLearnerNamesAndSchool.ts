import { Request, Response } from 'express';
import { ResponseHandler } from '../../utils/responseHandler';
import httpStatus from 'http-status';
import * as _ from 'lodash';
import { amlError } from '../../types/amlError';
import { AppDataSource } from '../../config';
import { getCSVEntries } from './helper';
import { SectionMaster } from '../../models/sectionMaster';
import * as uuid from 'uuid';
import { getLearnerByUserName } from '../../services/learner';
import { schoolService } from '../../services/schoolService';
import { Learner } from '../../models/learner';
import bcrypt from 'bcrypt';

const updateLearnerNamesAndSchool = async (req: Request, res: Response) => {
  const csvFile = _.get(req, ['files', 'document'], {});

  if (!csvFile) {
    const code = 'UPLOAD_INVALID_INPUT';
    throw amlError(code, 'document missing', 'BAD_REQUEST', 400);
  }

  const rows = getCSVEntries(csvFile);
  const transaction = await AppDataSource.transaction();

  const sections = await SectionMaster.findAll();
  const sectionsMap = sections.reduce((agg, curr) => {
    _.set(agg, curr.section, curr.identifier);
    return agg;
  }, {});
  const schoolsMap = {};
  const classMapping: any = {
    'class-two': '9b50a7e7-fdec-4fd7-bf63-84b3e62e4247',
    'class-three': '9b50a7e7-fdec-4fd7-bf63-84b3e62e4246',
    'class-four': '9b50a7e7-fdec-4fd7-bf63-84b3e62e4245',
    'class-five': '9b50a7e7-fdec-4fd7-bf63-84b3e62e4212',
    'class-six': '9b50a7e7-fdec-4fd7-bf63-84b3e62e4243',
  };

  const usernameHeaderIndex = rows[0].findIndex((item) => item.toLowerCase() === 'username');
  const validRows = rows.filter((row) => !!row[usernameHeaderIndex]).slice(1);

  try {
    for (const row of validRows) {
      const [name, className, section, school, , username, password] = row;
      let schoolId = _.get(schoolsMap, school);
      if (!schoolId) {
        let schoolEntry = await schoolService.findSchoolByName(school.trim());
        if (!schoolEntry) {
          schoolEntry = await schoolService.create({ name: school.trim(), identifier: uuid.v4(), board_id: '9b50a7e7-fdec-4fd7-bf63-84b3e62e334f', created_by: 'system' });
        }
        schoolId = schoolEntry.identifier;
        _.set(schoolsMap, school, schoolId);
      }
      const transformedName = name
        .trim()
        .toLowerCase()
        .split(' ')
        .map((token) => _.capitalize(token))
        .join(' ');
      const learnerExists = await getLearnerByUserName(username);
      if (learnerExists) {
        await learnerExists.update(
          {
            name: transformedName,
            section_id: _.get(sectionsMap, section.toUpperCase(), null),
            school_id: schoolId,
          },
          { transaction },
        );
      } else {
        const encryptedText = await bcrypt.hash(password, 10);
        await Learner.create(
          {
            identifier: uuid.v4(),
            username,
            password: encryptedText,
            name: transformedName,
            section_id: _.get(sectionsMap, section.toUpperCase(), null),
            school_id: schoolId,
            created_by: 'system_admin',
            tenant_id: '9b50a7e7-fdec-4fd7-bf63-84b3e62e334f',
            board_id: '9b50a7e7-fdec-4fd7-bf63-84b3e62e334f',
            class_id: _.get(classMapping, className),
            taxonomy: {},
          },
          { transaction },
        );
      }
    }
    await transaction.commit();
  } catch (e: any) {
    await transaction.rollback();
    throw amlError('SOMETHING_WENT_WRONG', e?.message, 'BAD_REQUEST', 400, Object.entries(e));
  }

  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { success: true } });
};

export default updateLearnerNamesAndSchool;
