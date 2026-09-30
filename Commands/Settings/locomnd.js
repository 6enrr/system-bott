const { EmbedBuilder, Colors } = require("discord.js");
const { owners, prefix } = require(`${process.cwd()}/config`);
const Data = require("pro.db");

module.exports = {
  name: "locomnd",
  run: (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const commandName = args[0];
    const Color =
      Data.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#f5f5ff";

    if (!commandName) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n locomnd ban**`);
      return message.reply({ embeds: [embed] });
    }

    const key = `command_enabled_${commandName}`;
    const current = Data.get(key);
    if (current === undefined) {
      Data.set(key, false);
    } else if (!current) {
      Data.set(key, true);
    } else {
      Data.set(key, false);
    }
    message.react("✅");
  },
};
