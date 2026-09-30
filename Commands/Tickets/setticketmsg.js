const { EmbedBuilder } = require("discord.js");
const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "setticketmsg",
  aliases: ["set-tmsg", "ticketmsg"],
  description: "تغيير رسالة الترحيب داخل التذكرة",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) 
      return message.reply("❌ هذا الأمر فقط للمالك.");

    const text = args.join(" ");
    if (!text) return message.reply("❌ يرجى كتابة الرسالة الجديدة.");

    db.set(`ticket_message_${message.guild.id}`, text);

    message.reply("✅ تم حفظ رسالة التذكرة بنجاح!");
  },
};
