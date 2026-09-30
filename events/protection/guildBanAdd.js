const db = require("pro.db");
const { AuditLogEvent, PermissionsBitField } = require("discord.js");
const { isBypassed, log } = require("./_utils");
const { applyPunishment } = require("./_punish");

module.exports = async (client, ban) => {
  const guild = ban.guild;
  if (!guild) return;

  const global = db.get(`protectionEnabled_${guild.id}`);
  if (global === false) return;

  const me = guild.members.me;
  if (!me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return;

  const entry = await guild
    .fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 })
    .then((a) => a.entries.first())
    .catch(() => null);

  const executorId = entry?.executor?.id;
  const targetId = entry?.target?.id;

  if (!executorId || !targetId) return;
  if (targetId !== ban.user.id) return;

  if (isBypassed(guild, executorId)) return;

  await log(guild, `🛡️ **AntiBan**: تم حظر <@${targetId}> بواسطة <@${executorId}>`);

  await guild.members.unban(targetId, "AntiBan: revert").catch(() => {});

  await applyPunishment({
    guild,
    executorId,
    key: "punish_ban_",
    reason: "AntiBan: unauthorized ban",
  });
};