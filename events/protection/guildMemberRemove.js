const db = require("pro.db");
const { AuditLogEvent, PermissionsBitField } = require("discord.js");
const { isBypassed, log } = require("./_utils");
const { applyPunishment } = require("./_punish");

module.exports = async (client, member) => {
  const guild = member.guild;
  if (!guild) return;

  const global = db.get(`protectionEnabled_${guild.id}`);
  if (global === false) return;

  const me = guild.members.me;
  if (!me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return;

  const entry = await guild
    .fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 })
    .then((a) => a.entries.first())
    .catch(() => null);

  const executorId = entry?.executor?.id;
  const targetId = entry?.target?.id;

  if (!executorId || !targetId) return;
  if (targetId !== member.id) return;

  const created = entry?.createdTimestamp || 0;
  if (Date.now() - created > 5000) return;

  if (isBypassed(guild, executorId)) return;

  await log(guild, `🛡️ **AntiKick**: تم طرد <@${targetId}> بواسطة <@${executorId}>`);

  await applyPunishment({
    guild,
    executorId,
    key: "punish_kick_",
    reason: "AntiKick: unauthorized kick",
  });
};