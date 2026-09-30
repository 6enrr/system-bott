const { EmbedBuilder, PermissionsBitField, Colors } = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "bots",
  description: "عرض جميع البوتات الموجودة في السيرفر مع وقت انضمامها",
  run: async (client, message) => {
    if (!message.guild) return;

    const Data = db.get(`Allow - Command bots = [ ${message.guild.id} ]`);
    const allowedRole = Data ? message.guild.roles.cache.get(Data) : null;
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === Data ||
      message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!isAuthorAllowed) return message.reply("❌");

    const Color =
      db.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      Colors.Blurple;

    const bots = message.guild.members.cache
      .filter((member) => member.user.bot)
      .sort((a, b) => (a.joinedTimestamp ?? 0) - (b.joinedTimestamp ?? 0));

    if (bots.size === 0) {
      return message.reply({ content: "لا يوجد أي بوتات في هذا السيرفر." });
    }

    const formatDate = (ts) => `<t:${Math.floor((ts ?? Date.now()) / 1000)}:R>`;

    const lines = [];
    let i = 1;
    for (const bot of bots.values()) {
      const joinedAtFormatted = formatDate(bot.joinedTimestamp);
      lines.push(`**\`${i}\` <@${bot.user.id}> | ${joinedAtFormatted}**`);
      i++;
      if (lines.join("\n").length > 3800) {
        lines.push(`… والقائمة مستمرة (${bots.size} بوت)`);
        break;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(Color)
      .setTitle(`🤖 قائمة البوتات (${bots.size})`)
      .setDescription(lines.join("\n"));

    return message.reply({ embeds: [embed] });
  },
};
