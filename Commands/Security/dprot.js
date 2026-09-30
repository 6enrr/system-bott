const dbq = require("pro.db");
const { EmbedBuilder } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "dprot",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member) return message.reply("❌ يرجى ذكر عضو صالح.");

    let bypassedMembers =
      (await dbq.get(`bypassedMembers_${message.guild.id}`)) || [];

    if (bypassedMembers.includes(member.id)) {
      bypassedMembers = bypassedMembers.filter((id) => id !== member.id);
      await dbq.set(`bypassedMembers_${message.guild.id}`, bypassedMembers);
      message.reply(`✅ ${member.user.tag} تمت إزالته من القائمة.`);
    } else {
      message.reply(`⚠️ ${member.user.tag} ليس في القائمة.`);
    }
  },
};
