const redisClass = require("redis");
const blueBird = require("bluebird");
const _ = require("lodash");

const DEFAULT_PREFIX = "POMELO:CHANNEL";

class StatusChannelManager {
  constructor(app, opts) {
    this.app = app;
    blueBird.promisifyAll(redisClass.RedisClient.prototype);
    blueBird.promisifyAll(redisClass.Multi.prototype);
    this.opts = opts || {};
    this.prefix = opts.prefix || DEFAULT_PREFIX;
    if (this.opts.auth_pass) {
      this.opts.password = this.opts.auth_pass;
      delete this.opts.auth_pass;
    }
    this.redisClient = null;
  }

  async start() {
    return new Promise((resolve, reject) => {
      const redisClient = redisClass.createClient(this.opts);
      redisClient.on("error", err => {
        // throw new Error(`[globalChannel][redis errorEvent]err:${err.stack}`);
        return reject(`[globalChannel][redis errorEvent]err:${err.stack}`);
      });

      redisClient.on("ready", err => {
        if (err) {
          return reject(`[globalChannel][redis readyEvents]err:${err.stack}`);
        }
        this.redisClient = redisClient;
        return resolve();
      });
    });
  }

  async stop(force = true) {
    if (this.redisClient) {
      // this.redisClient.quit();
      await this.redisClient.quitAsync();
      // this.redisClient.end(force);
      this.redisClient = null;
      return true;
    }
    return true;
  }

  async clean() {
    const cleanKey = StatusChannelManager.GenCleanKey(this.prefix);
    const result = await this.redisClient.keysAsync(cleanKey);
    if (_.isArray(result) && result.length > 0) {
      const cmdArr = [];
      for (const value of result) {
        cmdArr.push(["del", value]);
      }
      return await StatusChannelManager.ExecMultiCommands(
        this.redisClient,
        cmdArr
      );
    }
    return [];
  }

  async flushall() {
    return await this.redisClient.flushallAsync();
  }

  async add(uid, sid) {
    const genKey = StatusChannelManager.GenKey(this.prefix, uid);
    return await this.redisClient.saddAsync(genKey, sid);
  }

  async leave(uid, sid) {
    const genKey = StatusChannelManager.GenKey(this.prefix, uid);
    return await this.redisClient.sremAsync(genKey, sid);
  }

  async getSidsByUid(uid) {
    const genKey = StatusChannelManager.GenKey(this.prefix, uid);
    return await this.redisClient.smembersAsync(genKey);
  }

  async getSidsByUidArr(uidArr) {
    const cmdArr = [];
    for (const uid of uidArr) {
      cmdArr.push(["smembers", StatusChannelManager.GenKey(this.prefix, uid)]);
    }
    const result = await StatusChannelManager.ExecMultiCommands(
      this.redisClient,
      cmdArr
    );
    return _.zipObject(uidArr, result);
  }

  static async ExecMultiCommands(redisClient, cmdList) {
    if (!cmdList || _.size(cmdList) <= 0) {
      return null;
    }
    return await redisClient.multi(cmdList).execAsync();
  }

  static GenKey(prefix, id, channelName = null) {
    let genKey = "";
    if (channelName == null) genKey = `${prefix}:${id}`;
    else genKey = `${prefix}:${channelName}:${id}`;
    return genKey;
  }

  static GenCleanKey(prefix) {
    return `${prefix}*`;
  }
}

module.exports = StatusChannelManager;
