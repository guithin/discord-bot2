import axios from 'axios';
import Discord, { Events, SlashCommandBuilder, REST, Routes } from 'discord.js';
import {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  entersState,
  AudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
} from '@discordjs/voice';
import { DRequestHandler, getManager } from 'src/discordWrap';
import googleTTS from 'src/googleTTS';
import util from 'src/util';
import { autoDelete, initialize as adInit } from './autoDelete';
import { disabled, initialize as dsInit } from './disabled';

const queue: { [key: string]: string[]; } = {};
const audioPlayer: { [key: string]: AudioPlayer; } = {};
const audioLock: {
  [key: string]: {
    promise: Promise<void>;
    resolver: () => unknown;
  } | null;
} = {};

export const initialize = async () => {
  await adInit();
  await dsInit();

  const manager = getManager();
  const guilds = await manager.client.guilds.fetch();
  guilds.forEach(({ id, name }) => {
    queue[id] = [];
    audioLock[id] = null;
    console.log(`[guildCreate]: ${name} (${id})`);
  });

  manager.client.on('guildCreate', (guild) => {
    queue[guild.id] = [];
    audioLock[guild.id] = null;
    console.log(`[guildCreate]: ${guild.name} ${guild.id}`);
  });

  manager.client.on('voiceStateUpdate', (oldState, newState) => {
    const conn = getVoiceConnection(newState.guild.id);
    if (!conn) return;
    if (oldState.channelId === conn.joinConfig.channelId && oldState.channel) {
      const mCnt = oldState.channel.members.reduce((p, v) => p += v.user.bot ? 0 : 1, 0);
      if (mCnt <= 0) {
        stop(oldState.guild.id);
      }
    }
  });
  const dt = new SlashCommandBuilder()
    .setName('help')
    .setDescription('사용법 안내');
  manager.client.on(Events.InteractionCreate, (interaction) => {
    if (!interaction.isCommand()) return;
    interaction.reply(`
\`" [text]\`: text를 음성으로 변환하여 재생합니다.
\`"stop\`: 음성 재생을 중지합니다.
\`"autoDelete [on|off]\`: 자동 삭제 기능을 설정합니다.
\`"disabled [on|off]\`: 음성 재생을 비활성화합니다. (관리자만 가능)

버그리포트 및 기능제안: on14@naver.com
    `);
  });

  const rest = new REST().setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationCommands(process.env.APP_ID),
    {
      body: [dt.toJSON()]
    }
  );
};

const checkQueueAndPlay = async (gid: string) => {
  const voiceConn = getVoiceConnection(gid);
  if (!voiceConn) return;
  if (disabled.has(gid)) return;
  if (queue[gid].length === 0) {
    return;
  }
  await entersState(audioPlayer[gid], AudioPlayerStatus.Idle, 10000);
  const lock = audioLock[gid];
  if (lock) {
    await lock.promise;
  }
  let resolver = () => {};
  const promise = new Promise<void>(async (resolve) => {
    resolver = resolve;
    const now = queue[gid].shift();
    if (typeof now !== 'undefined') {
      const res = await axios.get(googleTTS(now, { lang: 'ko', }), {
        responseType: 'stream',
        timeout: 10000,
      }).catch(() => null);
      if (res === null) {
        return;
      }
      audioPlayer[gid].play(createAudioResource(res.data, { inputType: StreamType.Arbitrary }));
    }
  });
  audioLock[gid] = { promise, resolver };
};

const pushQueue = async (msg: Discord.Message, str: string) => {
  if (!msg.guild) return;
  const uid = msg.author.id;
  const gid = msg.guild.id;
  if (autoDelete[uid] && autoDelete[uid].has(gid)) {
    setTimeout(() => {
      if (msg.deletable) {
        msg.delete();
      }
    }, 1000 * 60 * 2);
  }
  console.log(`[push query]: ${uid} -> ${gid} -- ${str}`);
  queue[gid].push(str);
  if (audioLock[gid] === null) {
    checkQueueAndPlay(gid);
  }
};

export const TTS: DRequestHandler = async (manager, msg) => {
  const { channel, guild } = msg;
  if (!guild) return;
  if (msg.author.bot) return;
  if (!(channel instanceof Discord.TextChannel)) return;
  if (disabled.has(guild.id)) {
    return util.replyAndDelete(msg, '봇이 비활성화 되어있습니다. 관리자에게 문의하세요.', 1000);
  }
  const str = msg.content.trim().slice(1).trim();
  if (str.length < 1) return;
  if (str.length > 100) return msg.reply('message too long');
  const voiceConn = getVoiceConnection(guild.id);
  if (voiceConn && voiceConn.joinConfig.channelId !== null) {
    const ret = guild.channels.cache.get(voiceConn.joinConfig.channelId);
    if (ret && ret instanceof Discord.VoiceChannel && ret.members.has(msg.author.id)) {
      if (queue[guild.id].length > 3) {
        channel.send('예약 TTS갯수를 초과하였습니다.');
        return;
      }
      return pushQueue(msg, str);
    }
  }
  if (audioPlayer[guild.id] && audioPlayer[guild.id].state.status === AudioPlayerStatus.Playing) {
    return msg.reply('다른 채널에서 이용중입니다.');
  }
  const vc = util.findUserVoiceChannel(msg.author.id, guild.channels);
  if (vc === null) return msg.reply('당신은 음성채널에 있지 않습니다.');
  if (vc.joinable === false) return msg.reply('채널에 참가 할 수 없습니다.');
  if (voiceConn) {
    voiceConn.destroy();
  }
  const newConn = joinVoiceChannel({
    channelId: vc.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });
  if (!audioPlayer[guild.id]) {
    audioPlayer[guild.id] = createAudioPlayer();
    audioPlayer[guild.id].on(AudioPlayerStatus.Idle, () => {
      audioLock[guild.id]?.resolver();
      audioLock[guild.id] = null;
      checkQueueAndPlay(guild.id);
    });
  }
  newConn.subscribe(audioPlayer[guild.id]);
  newConn.on(VoiceConnectionStatus.Disconnected, () => {
    stop(guild.id);
  });
  pushQueue(msg, str);
};

export const stop = (gid: string) => {
  const voiceConn = getVoiceConnection(gid);
  queue[gid] = [];
  audioLock[gid] = null;
  if (voiceConn) {
    voiceConn.destroy();
  }
  if (audioPlayer[gid]) {
    audioPlayer[gid].stop();
  }
};

export const stopProc: DRequestHandler = (_, msg) => {
  if (!msg.guild) return;
  stop(msg.guild.id);
};
