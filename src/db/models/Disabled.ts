import {
  Sequelize,
  Model,
  BIGINT,
} from 'sequelize';

export default class Disabled extends Model {
  gid!: string;

  static tableinit(sequelize: Sequelize) {
    this.init({
      gid: {
        type: BIGINT,
        primaryKey: true,
      },
    }, {
      tableName: 'Disabled',
      sequelize,
      charset: 'utf8mb4',
    });
  }
}
