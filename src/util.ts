import Discord from 'discord.js';

const isAdmin = async (userId: string, guild: Discord.Guild): Promise<boolean> => {
  const u = await guild.members.fetch(userId);
  if (!u) return false;
  let flag = false;
  u.roles.cache.forEach((r) => {
    if (r.permissions.has('ManageGuild')) {
      flag = true;
    }
  });
  return flag;
};

const findUserVoiceChannel = (userId: string, channels: Discord.GuildChannelManager): Discord.VoiceChannel | null => {
  for (let [_, c] of channels.cache) {
    if (c instanceof Discord.VoiceChannel && c.members.has(userId)) return c;
  }
  return null;
};

const replyAndDelete = (msg: Discord.Message, str: string, time = 3000) =>  {
  msg.reply(str).then((r) => {
    if (time > 0) {
      setTimeout(() => {
        if (msg.deletable) msg.delete();
        if (r.deletable) r.delete();
      }, time);
    }
  });
};

export default {
  isAdmin,
  findUserVoiceChannel,
  replyAndDelete,
};
