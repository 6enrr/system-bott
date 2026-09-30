const { owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  name: "brole",
  description: "إضافة/حذف رول من قائمة التخطي للحماية",
  usage: "brole <@role | roleId>",
  run: async (client, message, args) => {
    if (!message.guild) return;
    if (!owners.includes(message.author.id)) return message.react("❌");

    const role =
      message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if (!role) return message.reply("❌ اذكر رول صحيح.");

    const key = `bypassedRoles_${message.guild.id}`;
    let list = db.get(key) || [];

    if (list.includes(role.id)) {
      list = list.filter((x) => x !== role.id);
      db.set(key, list);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Orange)
            .setDescription(`☑️ تم حذف الرول من التخطي: <@&${role.id}>`),
        ],
      });
    } else {
      list.push(role.id);
      db.set(key, list);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`✅ تم إضافة الرول للتخطي: <@&${role.id}>`),
        ],
      });
    }
  },
};