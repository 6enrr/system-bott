const { owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  name: "brolelist",
  description: "عرض رتب التخطي للحماية",
  run: async (client, message) => {
    if (!message.guild) return;
    if (!owners.includes(message.author.id)) return message.react("❌");

    const list = db.get(`bypassedRoles_${message.guild.id}`) || [];
    if (!list.length) return message.reply("❌ لا توجد رتب تخطي.");

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle(`🛡️ Bypass Roles (${list.length})`)
      .setDescription(list.map((id, i) => `\`${i + 1}\` <@&${id}>`).join("\n"));

    return message.reply({ embeds: [embed] });
  },
};