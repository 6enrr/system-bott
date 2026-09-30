const { EmbedBuilder } = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "myprison",
  aliases: ["سجني"],
  run: async (client, message) => {
    const data = db.get(`prison_${message.author.id}`);
    if (!data)
      return message.reply("مافي سجلات سجن.");

    const emb = new EmbedBuilder()
      .setColor("#5c5e64")
      .setTitle("معلومات السجن")
      .setDescription(
        `السبب: ${data.reason}\nالمدة: ${data.time}\nبواسطة: <@${data.by}>`
      );

    message.channel.send({ embeds: [emb] });
  },
};
