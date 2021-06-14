import {
  Sequelize,
  Model,
  BIGINT,
  TINYINT,
} from 'sequelize';

export default class Notice extends Model {
  gid!: string;
  cid!: string;
  sunday!: number;

  static tableinit(sequelize: Sequelize) {
    this.init({
      gid: {
        type: BIGINT,
        primaryKey: true,
      },
      cid: {
        type: BIGINT,
        allowNull: false,
      },
      sunday: {
        type: TINYINT,
        allowNull: false,
        defaultValue: 0,
      }
    }, {
      tableName: 'Notice',
      sequelize,
      charset: 'utf8mb4',
    });
  }
}
