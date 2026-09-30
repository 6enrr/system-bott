const db = require("pro.db");
const { applyPunishment } = require("./_punish");

const buckets = new Map();

async function hitRateLimit({ guild, executorId, reason }) {
  const gid = guild.id;
  const limit = db.get(`rl_limit_${gid}`) ?? 3;
  const windowMs = db.get(`rl_windowMs_${gid}`) ?? 10_000;

  const key = `${gid}:${executorId}`;
  const now = Date.now();
  const b = buckets.get(key) || { count: 0, ts: now };

  if (now - b.ts > windowMs) {
    b.count = 0;
    b.ts = now;
  }

  b.count += 1;
  buckets.set(key, b);

  if (b.count >= limit) {
    b.count = 0;
    b.ts = now;
    buckets.set(key, b);

    await applyPunishment({
      guild,
      executorId,
      key: "rl_punish_",
      reason: `RateLimit: ${reason}`,
    });
  }
}

module.exports = { hitRateLimit };