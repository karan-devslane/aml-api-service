import { QueryInterface, DataTypes } from 'sequelize';

const tableName = 'repository_associations';
const columnName = 'identifier';

export = {
  /**
   * Write code here for migration.
   *
   * @param queryInterface
   */
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    });
  },

  /**
   * Write code here for migration rollback.
   *
   * @param queryInterface
   */
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn(tableName, columnName);
  },
};
