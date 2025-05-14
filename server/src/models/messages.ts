import { Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import { mysqlConn } from '../connection/mysql';

class Messages extends Model<InferAttributes<Messages>, InferCreationAttributes<Messages>> {
  declare id?: string;
  declare content: string;
  declare from: string;
  declare to: string;
  declare file?: boolean;
}

Messages.init({
  id: { type: DataTypes.STRING(36), defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  from: { type: DataTypes.STRING(36), allowNull: false },
  to: { type: DataTypes.STRING(36), allowNull: false },
  file: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  sequelize: mysqlConn,
  timestamps: true,
}
);

export { Messages };