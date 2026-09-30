const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "setlog",
  description: "تعيين قناة لوق لنوع محدد وحفظها في قاعدة البيانات.",
  usage: "!setlog <نوع> #channel",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const logType = args[0];
    const ch = message.mentions.channels.first();

    if (!logType || !ch)
      return message.reply("**يرجى كتابة نوع اللوق ومنشن القناة.**");

    db.set(`${logType}_${message.guild.id}`, ch.id);
    message.react("✅");
  },
};
