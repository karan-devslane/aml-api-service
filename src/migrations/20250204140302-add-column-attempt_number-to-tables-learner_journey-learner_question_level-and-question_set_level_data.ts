import { QueryInterface, DataTypes } from 'sequelize';
import { AppDataSource } from '../config';

const tableNames = ['learner_journey', 'learner_proficiency_question_level_data', 'learner_proficiency_question_set_level_data'];
const columnName = 'attempt_number';

export = {
  /**
   * Write code here for migration.
   *
   * @param queryInterface
   */
  up: async (queryInterface: QueryInterface) => {
    const transaction = await AppDataSource.transaction();
    try {
      for (const tableName of tableNames) {
        await queryInterface.addColumn(
          tableName,
          columnName,
          {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
          },
          { transaction },
        );
      }
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
    }
  },

  /**
   * Write code here for migration rollback.
   *
   * @param queryInterface
   */
  down: async (queryInterface: QueryInterface) => {
    const transaction = await AppDataSource.transaction();
    try {
      for (const tableName of tableNames) {
        await queryInterface.removeColumn(tableName, columnName, { transaction });
      }
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
    }
  },
};
