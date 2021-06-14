import axios from 'axios';
import Discord from 'discord.js';
import { DRequestHandler, getManager } from 'src/discordWrap';
import googleTTS from 'src/googleTTS';
import util from 'src/util';
import { autoDelete, initialize as adInit } from './autoDelete';
import { disabled, initialize as dsInit } from './disabled';
const queue: { [key: string]: string[]; } = {};
const channelLocked: { [key: string]: boolean; } = {};

export const initialize = async () => {
  await adInit();
  await dsInit();
  const manager = getManager();
  manager.client.guilds.cache.forEach(({ id }) => {
    queue[id] = [];
    channelLocked[id] = false;
  });
  manager.client.on('voiceStateUpdate', (oldStage, newState) => {
    const conn = newState.client.voice?.connections.get(newState.guild.id);
    if (!conn) return;
    let mCnt = 0;
    conn.channel.members.forEach((m) => {
      if (!m.user.bot) mCnt++;
    });
    if (mCnt <= 0) {
      stop(newState.guild.id);
    }
  });
};

const checkQueueAndPlay = async (gid: string) => {
  const voiceConn = getManager().client.voice?.connections.get(gid);
  if (!voiceConn) return;
  if (disabled.has(gid)) return;
  if (queue[gid].length === 0) {
    return channelLocked[gid] = false;
  }
  const now = queue[gid].shift();
  if (typeof now !== 'undefined') {
    const res = await axios.get(googleTTS(now, { lang: 'ko', }), {
      responseType: 'stream',
    });
    voiceConn.play(res.data, {
      volume: 1,
    }).on('finish', () => checkQueueAndPlay(gid));
  }
};

const pushQueue = async (msg: Discord.Message, str: string) => {
  if (!msg.guild) return;
  const uid = msg.author.id;
  const gid = msg.guild.id;
  if (autoDelete[uid] && autoDelete[uid].has(gid)) {
    setTimeout(() => {
      if (msg.deletable) msg.delete();
    }, 1000 * 60 * 2);
  }
  console.log(`[push query]: ${uid} -> ${gid} -- ${str}`);
  const voiceConn = getManager().client.voice?.connections.get(gid);
  if (channelLocked[gid] !== true && voiceConn && voiceConn.dispatcher === null) {
    channelLocked[gid] = true;
    const res = await axios.get(googleTTS(str, { lang: 'ko', }), {
      responseType: 'stream',
    });
    voiceConn.play(res.data, {
      volume: 1,
    }).on('finish', () => checkQueueAndPlay(gid));
    return;
  }
  queue[gid].push(str);
};

export const TTS: DRequestHandler = async (manager, msg) => {
  if (!msg.guild) return;
  if (disabled.has(msg.guild.id)) {
    return util.replyAndDelete(msg, '봇이 비활성화 되어있습니다. 관리자에게 문의하세요.', 1000);
  }
  const str = msg.content.trim().slice(1).trim();
  if (str.length < 1) return;
  if (str.length > 100) return msg.reply('message too long');
  const voiceConn = manager.client.voice?.connections.get(msg.guild.id);
  if (voiceConn && voiceConn.channel.members.has(msg.author.id)) {
    if (queue[msg.guild.id].length > 3) {
      msg.channel.send('예약 TTS갯수를 초과하였습니다.');
      return;
    }
    return pushQueue(msg, str);
  }
  if (channelLocked[msg.guild.id]) return msg.reply('다른 채널에서 이용중입니다.');
  const vc = util.findUserVoiceChannel(msg.author.id, msg.guild.channels);
  if (vc === null) return msg.reply('당신은 음성채널에 있지 않습니다.');
  if (vc.joinable === false) return msg.reply('채널에 참가 할 수 없습니다.');
  if (voiceConn) {
    channelLocked[msg.guild.id] = true;
    voiceConn.disconnect();
    await new Promise((res) => setTimeout(res, 1000));
  }
  const newConn = await vc.join();
  newConn.on('disconnect', () => {
    if (!msg.guild) return;
    stop(msg.guild.id);
  });
  channelLocked[msg.guild.id] = false;
  pushQueue(msg, str);
};

export const stop = (gid: string) => {
  const voiceConn = getManager().client.voice?.connections.get(gid);
  channelLocked[gid] = true;
  queue[gid] = [];
  if (voiceConn) {
    voiceConn.disconnect();
    setTimeout(() => channelLocked[gid] = false, 1000);
  } else {
    channelLocked[gid] = false;
  }
};

export const stopProc: DRequestHandler = (_, msg) => {
  if (!msg.guild) return;
  stop(msg.guild.id);
};
