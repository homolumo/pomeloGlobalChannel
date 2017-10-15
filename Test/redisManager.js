/**
 * Created by frank on 16-11-3.
 */

const _ = require("lodash");
const config = require("./config/redisConfig").redisChannel;
const RedisManager = require("../lib/manager/RedisGlobalChannelManager");

const redisManager = new RedisManager(null, config);

const serverType = "connector";
const serverId = ["connector_1", "connector_2", "connector_3"];
const serverData = [
  { id: "connector_1" },
  { id: "connector_2" },
  { id: "connector_3" }
];
const channelName = "channelName";

describe("channelName", () => {
  before(done => {
    (async () => {
      await redisManager.start();
      await redisManager.clean();
    })().then(() => {
      done();
    });
  });

  after(done => {
    (async () => {
      await redisManager.stop();
    })().then(() => {
      done();
    });
  });

  it("add", done => {
    (async () => {
      const coArr = [];
      for (let i = 0; i < 10; i++) {
        coArr.push(
          await redisManager.add(`uuid_${i}`, _.sample(serverId), channelName)
        );
      }
      const result = await coArr;
      console.info(result);
    })().then(() => {
      done();
    });
  });

  it("getMembersBySid", done => {
    (async () => {
      const members = await redisManager.getMembersBySid(
        channelName,
        _.sample(serverId)
      );
      console.info(members);
    })().then(() => {
      done();
    });
  });

  it("leave", done => {
    (async () => {
      const coArr = [];
      for (const id of serverId) {
        coArr.push(redisManager.leave("uuid_1", id, channelName));
      }
      const result = await Promise.all(coArr);
      console.info(result);
    })().then(() => {
      done();
    });
  });

  it("getMembersByChannel", done => {
    (async () => {
      const members = await redisManager.getMembersByChannelName(
        serverData,
        channelName
      );
      console.info(members);
    })().then(() => {
      done();
    });
  });
});

describe("global service ", () => {
  before(done => {
    (async () => {
      await redisManager.start();
      await redisManager.clean();
    })().then(() => {
      done();
    });
  });

  after(done => {
    (async () => {
      await redisManager.stop();
    })().then(() => {
      done();
    });
  });

  it("add", done => {
    (async () => {
      const coArr = [];
      for (let i = 0; i < 10; i++) {
        coArr.push(redisManager.add(`uuid_${i % 3}`, _.sample(serverId)));
      }
      const result = await Promise.all(coArr);
      console.info(result);
    })().then(() => {
      done();
    });
  });

  it("getSidsByUid", done => {
    (async () => {
      const members = await redisManager.getSidsByUid("uuid_1");
      console.info(members);
    })().then(() => {
      done();
    });
  });

  it("getSidsByUidArr", done => {
    (async () => {
      const members = await redisManager.getSidsByUidArr([
        "uuid_1",
        "uuid_2",
        "uuid_0"
      ]);
      console.info(members);
    })().then(() => {
      done();
    });
  });

  it("leave", done => {
    (async () => {
      const coArr = [];
      for (const id of serverId) {
        coArr.push(redisManager.leave("uuid_1", id));
      }
      const result = await Promise.all(coArr);
      console.info(result);
    })().then(() => {
      done();
    });
  });

  it("getSidsByUidArr", done => {
    (async () => {
      const members = await redisManager.getSidsByUidArr([
        "uuid_1",
        "uuid_2",
        "uuid_0"
      ]);
      console.info(members);
    })().then(() => {
      done();
    });
  });
});
