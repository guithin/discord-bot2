import { DRequestHandler } from 'src/discordWrap';
import {
  Disabled,
} from 'src/db';
import util from 'src/util';

export let disabled = new Set<string>();

// "setting disable on
// "setting disable off
export const setDisabled: DRequestHandler = async (manager, msg) => {
  if (!msg.guild) return;
  if (!util.isAdmin(msg.author.id, msg.guild)) {
    return util.replyAndDelete(msg, '관리자가 사용할 수 있는 기능입니다.');
  }
  const gid = msg.guild.id;
  const lst = msg.content.trim().split(' ').map(str => str.trim());
  const nowState = await Disabled.getDisabled(BigInt(gid));

  if (lst[1] === 'on') {
    if (nowState) return util.replyAndDelete(msg, '이미 사용이 중지되어 있습니다.');
    Disabled.insertDisabled(BigInt(gid)).then(() => {
      manager.handle('"stop', msg);
      disabled.add(gid);
      util.replyAndDelete(msg, '봇이 비활성화 되었습니다.', 0);
    });
  } else if (lst[1] === 'off') {
    if (!nowState) return util.replyAndDelete(msg, '이미 사용중입니다.');
    Disabled.deleteDisabled(BigInt(gid)).then(() => {
      disabled.delete(gid);
      util.replyAndDelete(msg, '봇이 활성화 되었습니다.', 0);
    });
  } else {
    util.replyAndDelete(msg, 'on / off 중에 사용하실 수 있습니다.');
  }
};

export const initialize = async () => {
  const lst = await Disabled.getAllDisbled().then(dt => dt.map(row => row.gid));
  disabled = new Set(lst);
};
