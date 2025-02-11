import { DataTypes, Model } from 'sequelize';
import { AppDataSource } from '../config';
import { Taxonomy } from '../types/taxonomy';

export class LearnerProficiencyQuestionSetLevelData extends Model {
  declare id: number;
  declare identifier: string;
  declare learner_id: string;
  declare question_set_id: string;
  declare taxonomy: Taxonomy;
  declare sub_skills: { [skillId: number]: number };
  declare score: number;
  declare attempt_number: number;
  declare attempts_count: number;
  declare created_by: string;
  declare updated_by: string;
}

LearnerProficiencyQuestionSetLevelData.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    identifier: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    learner_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    question_set_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    taxonomy: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    sub_skills: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    score: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    attempts_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    attempt_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    updated_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: AppDataSource,
    modelName: 'LearnerProficiencyQuestionSetLevelData',
    tableName: 'learner_proficiency_question_set_level_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);
