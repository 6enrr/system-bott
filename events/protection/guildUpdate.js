const db = require("pro.db");
const { AuditLogEvent } = require("discord.js");
const { isBypassed, log } = require("./_utils");

module.exports = async (client, oldGuild, newGuild) => {
  const gid = newGuild.id;

  const nameProt = db.get(`antiServerName_${gid}`);
  const avatarProt = db.get(`antiServerAvatar_${gid}`);

  if (!nameProt && !avatarProt) return;

  const entry = await newGuild
    .fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 })
    .then((a) => a.entries.first())
    .catch(() => null);

  const executorId = entry?.executor?.id;
  if (executorId && isBypassed(newGuild, executorId)) return;

  if (nameProt && oldGuild.name !== newGuild.name) {
    await newGuild.setName(oldGuild.name, "AntiServerName: revert").catch(() => {});
    await log(
      newGuild,
      `🛡️ **ServerName**: تم منع تغيير اسم السيرفر. الفاعل: ${executorId ? `<@${executorId}>` : "Unknown"}`
    );
  }

  if (avatarProt && oldGuild.iconURL() !== newGuild.iconURL()) {
    const saved = db.get(`savedServerAvatar_${gid}`);
    const icon = saved || oldGuild.iconURL({ extension: "png", size: 256 });
    if (icon) await newGuild.setIcon(icon, "AntiServerAvatar: revert").catch(() => {});
    await log(
      newGuild,
      `🛡️ **ServerAvatar**: تم منع تغيير صورة السيرفر. الفاعل: ${executorId ? `<@${executorId}>` : "Unknown"}`
    );
  }
};