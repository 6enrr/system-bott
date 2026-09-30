const { EmbedBuilder } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: "setreact",
  aliases: ["setreact"],
  description: "تحديد رياكشنات تلقائية لروم معين",
  run: async (client, message) => {
    if (!message.guild) return;
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = db.get(`Guild_Color_${message.guild.id}`) || "#f5f5ff";

    const args = message.content.trim().split(/\s+/);
    const channelArg = args[1];
    const emojis = args.slice(2).filter(Boolean).slice(0, 6);

    if (!channelArg || emojis.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**اكتب الامر كذا:**\n` +
          `\`setreact #test 🤍\`\n` +
          `**وتقدر تحط اكثر من ايموجي:**\n` +
          `\`setreact #test ✅ 🤍 😂\``
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
        .setDescription(`**الروم مو صحيح. مثال:** \`setreact #test 🤍\``);
      return message.reply({ embeds: [embed] });
    }

    db.set(`RoomInfo_${message.guild.id}_${channel.id}`, {
      channelId: channel.id,
      emojis,
    });

    return message.react("✅");
  },
};