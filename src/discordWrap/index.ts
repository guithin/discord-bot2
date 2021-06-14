import Discord, { Permissions } from 'discord.js';

export type DRequestHandler = (manager: DiscordManager, msg: Discord.Message) => unknown;

class DiscordManager {
  client = new Discord.Client();

  handleMapper: { [key: string]: DRequestHandler } = {};

  needPermission =
    Permissions.FLAGS.SEND_MESSAGES |
    Permissions.FLAGS.MANAGE_MESSAGES |
    Permissions.FLAGS.CONNECT |
    Permissions.FLAGS.SPEAK;

  token: string;

  constructor(token: string) {
    this.token = token;
  }

  login() {
    return this.client.login(this.token);
  }

  handleStart() {
    console.log(`[${this.client.user?.tag}] servise start`);
    this.client.on('message', (msg) => {
      const lst = msg.content.trim().split(' ');
      if (lst.length > 0) {
        this.handle(lst[0], msg);
      }
    });
  }

  attach(key: string, cb: DRequestHandler) {
    const fetch = this.handleMapper[key];
    if (typeof fetch !== 'undefined') {
      throw Error(`handle assign Error (${key})`);
    }
    this.handleMapper[key] = cb;
  }

  detach(key: string) {
    delete this.handleMapper[key];
  }

  handle(key: string, msg: Discord.Message) {
    const fetch = this.handleMapper[key];
    if (typeof fetch !== 'undefined') {
      fetch(this, msg);
    }
  }
}

let manager: DiscordManager | null = null;

export const getManager = () => {
  if (manager === null) {
    throw Error('discord manager is not inited');
  }
  return manager;
};
export const setManager = (token: string) => {
  if (manager) {
    throw Error('already exist');
  }
  return manager = new DiscordManager(token);
};
