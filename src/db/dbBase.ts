import { Sequelize, Options } from 'sequelize';

let sequelize: Sequelize | null = null;

export const createDB = (opts: Options) => {
  return sequelize = new Sequelize(opts);
};

export const getDB = () => {
  if (sequelize === null) {
    throw Error('db not exist');
  }
  return sequelize;
};
