const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "ticlog",
  description: "تعيين روم لوق التذاكر",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;
    if (message.author.bot) return;

    let channel = message.mentions.channels.first();
    if (!channel) {
      const idOrName = message.content.split(/\s+/)[1];
      if (!idOrName) return message.reply({ content: "**يرجى ارفاق منشن الشات او الايدي.**" });
      channel = message.guild.channels.cache.get(idOrName) ||
                message.guild.channels.cache.find(c => c.name === idOrName);
    }
    if (!channel) return message.reply({ content: "**الشات غير موجود.**" });

    await message.react("✅");
    db.set(`Channel = [${message.guild.id}]`, channel.id);
  },
};
