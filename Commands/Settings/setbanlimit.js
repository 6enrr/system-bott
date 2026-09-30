const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "setbanlimit",
  aliases: ["setban"],
  description: "تعيين الحد الأقصى لعدد الباندات اليومية في السيرفر.",
  usage: "!setbanlimit <number>",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const limit = parseInt(args[0], 10);
    if (isNaN(limit) || limit <= 0)
      return message.reply("**يرجى إدخال رقم صحيح أكبر من 0.**");

    db.set(`ban_limit_${message.guild.id}`, limit);
    message.reply(`✅ تم تعيين حد الباند اليومي إلى **${limit}**.`);
  },
};
