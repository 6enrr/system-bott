const db = require("pro.db");

function isBypassed(guild, userId) {
  if (!guild || !userId) return false;

  if (guild.ownerId === userId) return true;

  const members = db.get(`bypassedMembers_${guild.id}`) || [];
  if (Array.isArray(members) && members.includes(userId)) return true;

  const roles = db.get(`bypassedRoles_${guild.id}`) || [];
  if (Array.isArray(roles) && roles.length) {
    const member = guild.members.cache.get(userId);
    if (member && member.roles.cache.some((r) => roles.includes(r.id))) return true;
  }

  return false;
}

async function getLogChannel(guild) {
  const id =
    db.get(`logChannel_${guild.id}`) ||
    db.get(`logprotection_${guild.id}`) ||
    db.get(`logantidelete_${guild.id}`) ||
    null;

  if (!id) return null;
  return guild.channels.cache.get(id) || null;
}

async function log(guild, content) {
  try {
    const ch = await getLogChannel(guild);
    if (ch) ch.send({ content }).catch(() => {});
  } catch {}
}

module.exports = { isBypassed, log };