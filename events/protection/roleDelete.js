const db = require("pro.db");
const { AuditLogEvent, PermissionsBitField } = require("discord.js");
const { isBypassed, log } = require("./_utils");

module.exports = async (client, role) => {
  const guild = role.guild;
  if (!guild) return;

  const enabled = db.get(`antiDelete_${guild.id}`);
  if (!enabled) return;

  const me = guild.members.me;
  if (!me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return;

  const entry = await guild
    .fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 })
    .then((a) => a.entries.first())
    .catch(() => null);

  const executorId = entry?.executor?.id;
  if (!executorId) return;

  if (isBypassed(guild, executorId)) return;

  await log(guild, `🛡️ **AntiDelete**: تم حذف رول **${role.name}** بواسطة <@${executorId}>`);

  const member = await guild.members.fetch(executorId).catch(() => null);
  if (member && member.kickable) {
    await member.kick("AntiDelete: RoleDelete").catch(() => {});
    await log(guild, `✅ تم طرد <@${executorId}> بسبب حذف رول.`);
  }
};