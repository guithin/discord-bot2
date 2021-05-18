import { setManager } from './discordWrap';
import {
  TTS,
  stopProc,
  initialize as TTSinit,
} from './tts';
import {
  autoDeleteF,
} from './tts/autoDelete';

const manager = setManager(process.env.TOKEN || '');

const initialize = async () => {
  manager.attach('"', TTS);
  manager.attach('"stop', stopProc);
  manager.attach('"autoDelete', autoDeleteF);
  await TTSinit();
};

initialize().then(() => {
  manager.start();
});
