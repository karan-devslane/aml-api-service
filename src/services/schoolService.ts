import { School } from '../models/school';

class SchoolService {
  static getInstance() {
    return new SchoolService();
  }

  async findSchoolByName(schoolName: string) {
    return School.findOne({
      where: {
        name: schoolName,
      },
    });
  }

  async create(data: { identifier: string; name: string; board_id: string; created_by: string }) {
    return School.create(data);
  }
}

export const schoolService = SchoolService.getInstance();
