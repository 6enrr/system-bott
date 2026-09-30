const db = require("pro.db");
const { EmbedBuilder, PermissionsBitField, AuditLogEvent } = require("discord.js");

module.exports = async (client, role) => {
  try {
    if (!role || !role.guild) return;

    const logroles = db.get(`logroles_${role.guild.id}`);
    if (!logroles) return;

    const me = role.guild.members.me;
    if (!me) return;

    if (!me.permissions.has(PermissionsBitField.Flags.EmbedLinks)) return;
    if (!me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return;

    const logChannel = role.guild.channels.cache.get(logroles);
    if (!logChannel) return;

    let executor = null;
    try {
      const logs = await role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleDelete,
        limit: 1,
      });
      const entry = logs.entries.first();
      if (entry) executor = entry.executor;
    } catch {
      executor = null;
    }

    const userTag = executor ? executor.tag : "غير معروف";
    const userId = executor ? executor.id : "0";
    const userAvatar = executor ? executor.displayAvatarURL({ dynamic: true }) : null;

    const roleDelete = new EmbedBuilder()
      .setAuthor({ name: userTag, iconURL: userAvatar || undefined })
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1091536665912299530/1153820347053920356/40A15AD6-0C21-43A5-A70A-6ED69615C182.png"
      )
      .setDescription(
        `**حذف الرول**\n\n**الرول : ${role.name}**\n**بواسطة : ${userId !== "0" ? `<@${userId}>` : "غير معروف"}**`
      )
      .setColor("#857f99")
      .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await logChannel.send({ embeds: [roleDelete] });
  } catch (e) {
    console.error("roleDelete error:", e);
  }
};