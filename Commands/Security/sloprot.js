const dbq = require("pro.db");
const { EmbedBuilder } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "sloprot",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const logChannel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]);
    if (!logChannel) return message.reply("❌ يرجى ذكر قناة صالحة.");

    await dbq.set(`logChannel_${message.guild.id}`, logChannel.id);
    message.reply(`✅ تم ضبط قناة السجل على <#${logChannel.id}>`);
  },
};
