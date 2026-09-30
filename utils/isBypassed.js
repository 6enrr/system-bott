const db = require("pro.db");

module.exports = function isBypassed({ guild, member, userId }) {
  if (!guild) return false;

  const uid = userId || member?.id;
  if (uid && uid === guild.ownerId) return true;

  const bypassedMembers = db.get(`bypassedMembers_${guild.id}`) || [];
  if (uid && bypassedMembers.includes(uid)) return true;

  const bypassedRoles = db.get(`bypassedRoles_${guild.id}`) || [];
  if (member && bypassedRoles.length) {
    if (member.roles.cache.some((r) => bypassedRoles.includes(r.id))) return true;
  }

  return false;
};