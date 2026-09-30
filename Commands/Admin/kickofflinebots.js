const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "kickofflinebots",
  run: async (client, message) => {
    const disabled = db.get(`command_enabled_kickofflinebots`);
    if (disabled === false) return;

    const color =
      db.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";

    const allowId = db.get(
      `Allow - Command kickofflinebots = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowId);
    const canUse =
      message.member.permissions.has(
        PermissionsBitField.Flags.BanMembers
      ) ||
      message.member.roles.cache.has(allowRole?.id) ||
      message.author.id === allowId;
    if (!canUse) return message.react("❌").catch(() => {});

    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.Flags.KickMembers
      )
    ) {
      return message.reply("ما عندي صلاحية Kick.");
    }

    const bots = message.guild.members.cache.filter(
      (m) =>
        m.user.bot &&
        (!m.presence || m.presence.status === "offline") &&
        m.id !== client.user.id
    );

    if (!bots.size)
      return message.reply("مافي بوتات اوفلاين.");

    const kicked = [];
    const failed = [];

    for (const bot of bots.values()) {
      if (bot.kickable) {
        await bot.kick("offline bot").catch(() => failed.push(bot.user.tag));
        kicked.push(bot.user.tag);
      } else {
        failed.push(bot.user.tag);
      }
    }

    const emb = new EmbedBuilder()
      .setColor(color)
      .setTitle("نتائج طرد البوتات")
      .addFields(
        {
          name: "✅ تم طرد",
          value: kicked.length ? kicked.join("\n") : "ولا واحد",
        },
        {
          name: "❌ فشل",
          value: failed.length ? failed.join("\n") : "ولا واحد",
        }
      );

    message.channel.send({ embeds: [emb] });
  },
};
