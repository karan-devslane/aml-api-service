import { QueryInterface, DataTypes } from 'sequelize';
import { LearnerJourneyStatus } from '../enums/learnerJourneyStatus';

const tableName = 'learner_journey';

export = {
  /**
   * Write code here for migration.
   *
   * @param queryInterface
   */
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable(tableName, {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      identifier: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      learner_id: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      question_set_id: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      completed_question_ids: {
        allowNull: true,
        type: DataTypes.JSONB,
      },
      status: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: LearnerJourneyStatus.IN_PROGRESS,
      },
      start_time: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      end_time: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      attempts_count: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      created_by: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      updated_by: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });
  },

  /**
   * Write code here for migration rollback.
   *
   * @param queryInterface
   */
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable(tableName);
  },
};
