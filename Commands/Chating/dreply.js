const { owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: "dreply",
  aliases: ["dreply"],
  description: "Delete an auto reply by key",
  category: "Informations",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Args = message.content.split(` `).slice(1).join(" ");
    if (!db.get(`Replys_${Args}`))
      return await message.reply({ content: `**ارسل الرد المُراد حذفه **` });

    db.delete(`Replys_${Args}`);
    message.react("✅");
  },
};
