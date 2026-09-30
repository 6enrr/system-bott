const { Colors } = require("discord.js");
const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "tcopen",
  description: "تعيين كاتجوري التذاكر",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;
    if (message.author.bot || !message.guild) return;

    const Cat = message.content.split(/\s+/)[1];
    if (!Cat) return message.reply({ content: "**يرجى ارفاق ايدي الكاتيغوري .**" });

    await message.react("✅");
    db.set(`Cat = [${message.guild.id}]`, Cat);
  },
};
