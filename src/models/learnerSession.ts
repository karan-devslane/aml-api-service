import { DataTypes, Model } from 'sequelize';
import { AppDataSource } from '../config';

export class LearnerSession extends Model {
  declare sid: string;
  declare sess: {
    learnerId: string;
  };
  declare expire: Date;
}

LearnerSession.init(
  {
    sid: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    sess: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    expire: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: AppDataSource,
    modelName: 'LearnerSession',
    tableName: 'learner_sessions',
    timestamps: false,
  },
);
