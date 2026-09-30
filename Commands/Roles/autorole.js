const { EmbedBuilder } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: "autorole",
  run: (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const Color =
      db.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#f5f5ff";

    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(
        message.content.split(" ").find((a) => /^\d+$/.test(a))
      );

    if (!role) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة .\n autorole @Role**`
        );
      return message.reply({ embeds: [embed] });
    }

    db.set(`autorole_${message.guild.id}`, role.id);
    message.react("✅");
  },
};
