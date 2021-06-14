import { Model, Options, Sequelize } from 'sequelize';
import Disabled from './models/Disabled';
import AutoDelete from './models/AutoDelete';
import Notice from './models/Notice';
import { createDB } from './dbBase';

const tableList: ((typeof Model) & { tableinit: (s: Sequelize) => void; })[] = [
  Disabled,
  AutoDelete,
  Notice,
];

let inited = false;

export const init = async (opts: Options) => {
  if (inited) return;
  inited = true;
  const sequelize = createDB(opts);
  tableList.forEach((i) => i.tableinit(sequelize));
  for await (const table of tableList) {
    await table.sync();
  }
};

export * as Disabled from './functions/Disabled';
export * as AutoDelete from './functions/AutoDelete';
