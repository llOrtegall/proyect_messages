import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USER, NODE_ENV } from '../schemas/envSchema';
import { Sequelize } from "sequelize";

const mysqlConn = new Sequelize(MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, {
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  dialect: "mysql",
  logging: NODE_ENV === "development" ? console.log : false,
});

export { mysqlConn };