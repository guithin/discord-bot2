import 'dotenv/config';
import stamp from 'console-stamp';
import { init as DBInit } from './db';
import { setManager } from './discordWrap';
import { autoDeleteF } from './tts/autoDelete';
import { setDisabled } from './tts/disabled';
import {
  TTS,
  stopProc,
  initialize as TTSinit,
} from './tts';

const manager = setManager(process.env.TOKEN);

const needEnvs = [
  'TOKEN',
  'DB_HOST',
  'DB_PORT',
  'DB_SCHEME_NAME',
  'DB_PASSWD',
  'DB_USERNAME',
];

const baseInitialize = async () => {
  needEnvs.forEach((envName) => {
    if (typeof process.env[envName] !== 'string') {
      console.error(`env not found (${envName})`);
      process.exit(0);
    }
  });
  await DBInit({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_SCHEME_NAME,
    password: process.env.DB_PASSWD,
    username: process.env.DB_USERNAME,
    timezone: '+09:00',
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
    },
    logging: process.env.NODE_ENV === 'dev' ? console.log : false,
  });
};

const managerInitialize = async () => {
  manager.attach('"', TTS);
  manager.attach('"stop', stopProc);
  manager.attach('"autoDelete', autoDeleteF);
  manager.attach('"disable', setDisabled);
  await TTSinit();
};

async function main() {
  stamp(console);
  await baseInitialize();
  await manager.login();
  await managerInitialize();
  manager.handleStart();
}

main();
////
