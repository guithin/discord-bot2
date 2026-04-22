import 'dotenv/config';
import stamp from 'console-stamp';
import { setManager } from './discordWrap';
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
  'APP_ID',
];

const baseInitialize = async () => {
  // needEnvs.forEach((envName) => {
  //   if (typeof process.env[envName] !== 'string') {
  //     console.error(`env not found (${envName})`);
  //     process.exit(0);
  //   }
  // });
};

const managerInitialize = async () => {
  manager.attach('"', TTS);
  manager.attach('"stop', stopProc);
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
