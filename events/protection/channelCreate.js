const db = require("pro.db");
const { AuditLogEvent, PermissionsBitField } = require("discord.js");
const { isBypassed, log } = require("./_utils");

module.exports = async (client, channel) => {
  const guild = channel.guild;
  if (!guild) return;

  const enabled = db.get(`anticreate_${guild.id}`);
  if (!enabled) return;

  const me = guild.members.me;
  if (!me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return;

  const entry = await guild
    .fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 })
    .then((a) => a.entries.first())
    .catch(() => null);

  const executorId = entry?.executor?.id;
  if (!executorId) return;

  if (isBypassed(guild, executorId)) return;

  await channel.delete("AntiCreate: ChannelCreate").catch(() => {});
  await log(guild, `🛡️ **AntiCreate**: تم إنشاء قناة ومنعها وحذفها. الفاعل: <@${executorId}>`);

  const member = await guild.members.fetch(executorId).catch(() => null);
  if (member && member.kickable) {
    await member.kick("AntiCreate: ChannelCreate").catch(() => {});
  }
};