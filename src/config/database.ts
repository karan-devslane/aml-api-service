import dotenv from 'dotenv';

dotenv.config({ path: '.env' }); // Required

export = {
  local: {
    username: process.env.AML_SERVICE_DB_USER,
    password: process.env.AML_SERVICE_DB_PASS,
    database: process.env.AML_SERVICE_DB_NAME,
    host: process.env.AML_SERVICE_DB_HOST,
    port: process.env.AML_SERVICE_DB_PORT,
    dialect: 'postgres',
    migrationStorageTableName: 'sequelize_meta',
  },
  development: {
    username: process.env.AML_SERVICE_DB_USER,
    password: process.env.AML_SERVICE_DB_PASS,
    database: process.env.AML_SERVICE_DB_NAME,
    host: process.env.AML_SERVICE_DB_HOST,
    port: process.env.AML_SERVICE_DB_PORT,
    dialect: 'postgres',
    migrationStorageTableName: 'sequelize_meta',
  },
};
