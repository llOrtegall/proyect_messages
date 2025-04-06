import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import { mysqlConn } from '../connection/mysql';

class Users extends Model<InferAttributes<Users>, InferCreationAttributes<Users>> {
  declare id?: string;
  declare username: string;
  declare password: string;
}

Users.init({
  id: { type: DataTypes.STRING(36), defaultValue: DataTypes.UUIDV4, allowNull: false },
  username: { type: DataTypes.STRING(50), allowNull: false, primaryKey: true, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
}, {
  sequelize: mysqlConn,
  timestamps: true,
}
);

export { Users };