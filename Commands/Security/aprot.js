const dbq = require("pro.db");
const { EmbedBuilder } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "aprot",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member) return message.reply("❌ يرجى ذكر عضو صالح.");

    let bypassed = (await dbq.get(`bypassedMembers_${message.guild.id}`)) || [];
    if (!bypassed.includes(member.id)) {
      bypassed.push(member.id);
      await dbq.set(`bypassedMembers_${message.guild.id}`, bypassed);
      return message.reply(`✅ ${member.user.tag} تمت إضافته إلى قائمة التجاوز.`);
    } else {
      return message.reply(`ℹ️ ${member.user.tag} موجود بالفعل في القائمة.`);
    }
  },
};
