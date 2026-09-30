const db = require("pro.db");
const { ChannelType, Colors, EmbedBuilder } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "clearcat",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    if (!args[0]) return message.reply("يرجى إدخال أي دي الكاتجري.");

    const categoryId = args[0];
    const category = message.guild.channels.cache.get(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return message.reply("كاتجوري غير صالح.");
    }

    db.set(`clearCategory_${message.guild.id}`, categoryId);
    message.reply(`تم تعيين الكاتجري <#${categoryId}> للمسح التلقائي.`);
  },
};
