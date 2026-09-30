const d8b = require("pro.db");
const { EmbedBuilder } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "ochat",
  description: "To set channel room",
  usage: "!set-channel <channel>",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = d8b.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = d8b.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    const channel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(message.content.split(" ")[1]);

    if (!channel) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة  \n ochat <#${message.channel.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    d8b.set(`setChannel_${message.guild.id}`, channel.id);
    message.react("✅");
  },
};
