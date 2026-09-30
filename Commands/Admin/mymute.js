const { EmbedBuilder } = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "mymute",
  aliases: ["ميوتاتي"],
  run: async (client, message, args) => {
    const target =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]) ||
      message.member;

    const muteData = db.get(`mute_${target.id}`);
    if (!muteData)
      return message.reply("مافي معلومات ميوت.");

    const emb = new EmbedBuilder()
      .setColor("#5c5e64")
      .setTitle(`معلومات الميوت لـ ${target.user.username}`)
      .setDescription(
        `السبب: ${muteData.reason}\nبواسطة: <@${muteData.by}>\nالمدة: ${muteData.time}`
      );

    message.channel.send({ embeds: [emb] });
  },
};
