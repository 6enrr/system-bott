const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "blockpic",
  run: async (client, message, args) => {
    const allowId = db.get(
      `Allow - Command blockpic = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowId);
    const canUse =
      message.member.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      ) ||
      message.member.roles.cache.has(allowRole?.id) ||
      message.author.id === allowId;

    if (!canUse)
      return message.reply("ما عندك إذن.");

    const user = message.mentions.users.first();
    if (!user) {
      const e = new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription(
          `استعمل:\n blockpic @عضو`
        );
      return message.reply({ embeds: [e] });
    }

    const list =
      db.get(`blocked_pics_${message.guild.id}`) || [];
    if (list.includes(user.id)) {
      return message.reply("هو أصلاً بلوك ✅");
    }

    list.push(user.id);
    db.set(`blocked_pics_${message.guild.id}`, list);

    message.reply(
      `تم منع ${user} من إرسال الصور ✅`
    );
  },
};
