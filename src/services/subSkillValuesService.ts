import { Transaction } from 'sequelize';
import { SubSkillValues } from '../models/subSkillValues';

class SubSkillValuesService {
  static getInstance() {
    return new SubSkillValuesService();
  }

  async create(data: { identifier: string; sub_skill_id: string; skill_value_name: string; sequence: number; created_by: string }, transaction: Transaction) {
    return SubSkillValues.create(data, { transaction });
  }
}

export const subSkillValuesService = SubSkillValuesService.getInstance();
