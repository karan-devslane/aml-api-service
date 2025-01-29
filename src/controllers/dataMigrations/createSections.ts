import { Request, Response } from 'express';
import * as uuid from 'uuid';
import { AppDataSource } from '../../config';
import { SectionMaster } from '../../models/sectionMaster';
import { ResponseHandler } from '../../utils/responseHandler';
import httpStatus from 'http-status';

const createSections = async (req: Request, res: Response) => {
  const sections = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

  const sectionsCreateBody = sections.map((section, index) => ({
    id: index + 1,
    identifier: uuid.v4(),
    section: section.toUpperCase(),
    created_by: 'system',
  }));

  const transaction = await AppDataSource.transaction();

  try {
    await SectionMaster.bulkCreate(sectionsCreateBody, { transaction });
    await transaction.commit();
  } catch (e: any) {
    await transaction.rollback();
  }

  ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: { success: true } });
};

export default createSections;
