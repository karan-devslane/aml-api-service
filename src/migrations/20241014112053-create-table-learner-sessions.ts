import { QueryInterface, DataTypes } from 'sequelize';

const tableName = 'learner_sessions';

export = {
  /**
   * Write code here for migration.
   *
   * @param queryInterface
   */
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable(tableName, {
      sid: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.STRING,
      },
      sess: {
        allowNull: false,
        type: DataTypes.JSONB,
      },
      expire: {
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
