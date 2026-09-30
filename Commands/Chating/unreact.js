const { EmbedBuilder } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: "unreact",
  aliases: ["unreact"],
  description: "حذف إعدادات الرياكشن التلقائي لروم معيّن",
  run: async (client, message) => {
    if (!message.guild) return;

    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = db.get(`Guild_Color_${message.guild.id}`) || "#f5f5ff";

    const args = message.content.trim().split(/\s+/);
    const channelArg = args[1];

    if (!channelArg) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**استعمل الأمر كذا:**\n` +
          `\`unreact #${message.channel.name}\``
        );
      return message.reply({ embeds: [embed] });
    }

    const channelId = channelArg.replace(/[^0-9]/g, "");
    const channel =
      message.guild.channels.cache.get(channelId) ||
      message.guild.channels.cache.find((c) => c.name === channelArg);

    if (!channel) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**الروم مو صحيح. مثال:** \`unreact #test\``);
      return message.reply({ embeds: [embed] });
    }

    const key = `RoomInfo_${message.guild.id}_${channel.id}`;

    const exists = db.get(key);
    if (!exists) {
      return message.reply("ℹ️ ما فيه اعدادات رياكشن لهذا الروم اصلا.");
    }

    db.delete(key);

    return message.react("✅");
  },
};