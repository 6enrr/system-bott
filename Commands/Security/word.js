const { EmbedBuilder, Colors } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: "word",
  aliases: ["word"],
  description: "إضافة أو إزالة كلمة من قائمة الكلمات المحظورة في السيرفر.",
  run: async (client, message) => {
    if (!message.guild) return;

    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    if (message.author.bot) return;

    const args = message.content.trim().split(/\s+/);
    const word = args.slice(1).join(" "); 

    if (!word) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Yellow)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.**\n\` word <كلمة>\``);

      return message.reply({ embeds: [embed] });
    }

    let words = db.get(`word_${message.guild.id}`) || [];
    const index = words.findIndex((w) => w.word === word);

    if (index !== -1) {
      words.splice(index, 1);
      db.set(`word_${message.guild.id}`, words);
      return message.react("☑️");
    } else {
      words.push({ word, addedBy: message.author.id });
      db.set(`word_${message.guild.id}`, words);
      return message.react("✅");
    }
  },
};
