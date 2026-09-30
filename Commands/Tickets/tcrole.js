const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "tcrole",
  description: "تعيين الرول المسؤول عن إدارة التذاكر",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    let role = message.mentions.roles.first();
    if (!role) {
      const idOrName = message.content.split(/\s+/)[1];
      if (!idOrName) return message.reply({ content: "**يرجى ارفاق منشن الرول أو الايدي.**" });
      role = message.guild.roles.cache.get(idOrName) ||
             message.guild.roles.cache.find(r => r.name === idOrName);
    }
    if (!role) return message.reply({ content: "**الرول غير موجود.**" });

    await message.react("✅");
    db.set(`Role = [${message.guild.id}]`, role.id);
  },
};
