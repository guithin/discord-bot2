import { DRequestHandler } from 'src/discordWrap';
import util from 'src/util';
import {
  AutoDelete,
} from 'src/db';

export const autoDelete: { [key: string]: Set<string> } = {};

export const autoDeleteF: DRequestHandler = (manager, msg) => {
  if (!msg.guild) return;
  const uid = msg.author.id;
  const gid = msg.guild.id;
  if (!autoDelete[uid]) {
    autoDelete[uid] = new Set();
  }
  const cmd = msg.content.trim().split(' ')[1];
  if (cmd === 'on') {
    if (autoDelete[uid].has(gid)) {
      util.replyAndDelete(msg, '이미 자동삭제가 켜져있습니다.');
      return;
    }
    AutoDelete.insertAutoDelete(BigInt(uid), BigInt(gid)).then(() => {
      autoDelete[uid].add(gid);
      util.replyAndDelete(msg, '자동삭제가 켜졌습니다.');
    });
  } else if (cmd === 'off') {
    if (!autoDelete[uid].has(gid)) {
      util.replyAndDelete(msg, '자동삭제가 켜져있지 않습니다.');
      return;
    }
    AutoDelete.deleteAutoDelete(BigInt(uid), BigInt(gid)).then(() => {
      autoDelete[uid].delete(gid);
      util.replyAndDelete(msg, '자동삭제가 꺼졌습니다.');
    });
  } else {
    util.replyAndDelete(msg, 'on / off 중에 사용하실 수 있습니다/');
  }
};

export const initialize = async () => {
  const adLst = await AutoDelete.getAllAutoDelete().then((r) => r.map(({ uid, gid }) => ({ uid, gid })));
  adLst.forEach((el) => {
    if (typeof autoDelete[el.uid] === 'undefined') {
      autoDelete[el.uid] = new Set();
    }
    autoDelete[el.uid].add(el.gid)
  });
};
