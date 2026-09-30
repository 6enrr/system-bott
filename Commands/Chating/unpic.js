const { EmbedBuilder } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Data = require("pro.db");

module.exports = {
  name: "unpic",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    const mentionedChannel = message.mentions.channels.first() || client.channels.cache.get(args[0]);
    if (!mentionedChannel) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n unpic <#${message.channel.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    let channels = Data.get(`setChannels_${message.guild.id}`) || [];
    const index = channels.indexOf(mentionedChannel.id);
    if (index !== -1) {
      channels.splice(index, 1);
      Data.set(`setChannels_${message.guild.id}`, channels);
      message.react("✅");
    } else {
      message.react("❌");
    }
  },
};
