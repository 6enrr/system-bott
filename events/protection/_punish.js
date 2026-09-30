const db = require("pro.db");
const { PermissionsBitField } = require("discord.js");
const { isBypassed, log } = require("./_utils");

async function stripRoles(member, reason) {
  const roles = member.roles.cache
    .filter((r) => r.id !== member.guild.id && !r.managed)
    .map((r) => r.id);

  if (!roles.length) return true;
  await member.roles.remove(roles, reason).catch(() => {});
  return true;
}

async function timeoutMember(member, minutes, reason) {
  const ms = minutes * 60 * 1000;
  await member.timeout(ms, reason).catch(() => {});
}

async function applyPunishment({ guild, executorId, key, reason }) {
  if (!guild || !executorId) return;

  if (isBypassed(guild, executorId)) return;

  const action = db.get(`${key}${guild.id}`) || "kick";
  const member = await guild.members.fetch(executorId).catch(() => null);

  await log(guild, `⚙️ Punish(${key}): <@${executorId}> => **${action}** | ${reason}`);

  if (!member) return;
  if (action === "none") return;

  if (action === "ban") {
    const me = guild.members.me;
    if (me?.permissions.has(PermissionsBitField.Flags.BanMembers) && member.bannable) {
      await member.ban({ reason }).catch(() => {});
    }
    return;
  }

  if (action === "kick") {
    const me = guild.members.me;
    if (me?.permissions.has(PermissionsBitField.Flags.KickMembers) && member.kickable) {
      await member.kick(reason).catch(() => {});
    }
    return;
  }

  if (action === "timeout") {
    const minutes = db.get(`timeout_minutes_${guild.id}`) || 10;
    await timeoutMember(member, minutes, reason);
    return;
  }

  if (action === "strip") {
    const me = guild.members.me;
    if (me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await stripRoles(member, reason);
    }
  }
}

module.exports = { applyPunishment };