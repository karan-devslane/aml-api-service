import { DataTypes, Model } from 'sequelize';
import { AppDataSource } from '../config';
import { QuestionOperation } from '../enums/questionOperation';

export class SubSkillMaster extends Model {
  declare id: number;
  declare identifier: string;
  declare topic: QuestionOperation;
  declare skill_name: string;
  declare skill_type: string;
  declare sequence: number;
  declare created_by: string;
  declare updated_by?: string | null;
}

SubSkillMaster.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    identifier: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    skill_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    skill_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    updated_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: AppDataSource,
    modelName: 'SubSkillMaster',
    tableName: 'sub_skill_master',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: 'Table to store sub-skill related data',
  },
);
