const { EmbedBuilder, Colors } = require("discord.js");
const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "serveravatar",
  description: "Toggle protection against server avatar changes.",
  usage: ` serveravatar <on|off>`,
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const action = (args[0] || "").toLowerCase();
    if (!["on", "off"].includes(action)) {
      return message.reply(`Please specify \`on\` or \`off\`. Usage: \`${module.exports.usage}\``);
    }

    const guildId = message.guild.id;

    if (action === "on") {
      const currentAvatar = message.guild.iconURL();
      await db.set(`savedServerAvatar_${guildId}`, currentAvatar);
      await db.set(`antiServerAvatar_${guildId}`, true);

      const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle("Server Avatar Protection Status")
        .setDescription(`Server avatar protection has been turned **on**. Current avatar saved.`);
      return message.channel.send({ embeds: [embed] });
    } else {
      await db.set(`antiServerAvatar_${guildId}`, false);
      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("Server Avatar Protection Status")
        .setDescription(`Server avatar protection has been turned **off**.`);
      return message.channel.send({ embeds: [embed] });
    }
  },
};
