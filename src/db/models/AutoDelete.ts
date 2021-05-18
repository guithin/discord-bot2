import {
  Sequelize,
  Model,
  INTEGER,
  BIGINT,
} from 'sequelize';

export default class AutoDelete extends Model {
  id!: number;
  gid!: string;
  uid!: string

  static tableinit(sequelize: Sequelize) {
    this.init({
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      gid: {
        type: BIGINT,
      },
      uid: {
        type: BIGINT,
      },
    }, {
      tableName: 'AutoDelete',
      sequelize,
      charset: 'utf8mb4',
      indexes: [{
        fields: ['uid', 'gid'],
        unique: true,
      }],
    });
  }
}
