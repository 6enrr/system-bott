const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "adminlist",
  aliases: ["قائمة الادمن"],
  description: "يظهر كل اللي عندهم ادمن بالسيرفر",
  run: async (client, message) => {
    const isEnabled = db.get(`command_enabled_adminlist`);
    if (isEnabled === false) return;

    const color =
      db.get(`Guild_Color_${message.guild.id}`) || "#5c5e64";

    const allowId = db.get(
      `Allow - Command adminlist = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowId);
    const canUse =
      message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      message.member.roles.cache.has(allowRole?.id) ||
      message.author.id === allowId;

    if (!canUse) return message.react("❌").catch(() => {});

    const admins = message.guild.members.cache.filter(
      (m) =>
        !m.user.bot &&
        m.permissions.has(PermissionsBitField.Flags.Administrator)
    );

    if (!admins.size)
      return message.reply("مافي أحد عنده أدمن غيرك 😂");

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("قائمة الأدمن")
      .setDescription(admins.map((m) => m.toString()).join(", "));

    message.reply({ embeds: [embed] });
  },
};
