const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("pro.db");
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "myvmute",
  aliases: ["ميوتي"],
  run: async (client, message, args) => {
    const allowId = db.get(
      `Allow - Command mute = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowId);
    const canUse =
      message.member.permissions.has(
        PermissionsBitField.Flags.MuteMembers
      ) ||
      message.member.roles.cache.has(allowRole?.id) ||
      owners.includes(message.author.id) ||
      message.author.id === allowId;

    if (!canUse)
      return message.reply("ما تقدر تستخدم الأمر.");

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member) {
      return message.reply(
        `استعمل:\n myvmute @عضو`
      );
    }

    const data = db.get(`voicemute_${member.id}`);
    if (!data) return message.reply("ما عنده ميوت صوتي محفوظ.");

    const emb = new EmbedBuilder()
      .setColor("#5c5e64")
      .setAuthor({
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(
        `**معلومات الميوت**\nبواسطة: <@${data.by}>\nالمدة: \`${data.time}\`\nينتهي: \`${data.times}\`\nالسبب: \`${data.reason}\``
      );

    message.channel.send({ embeds: [emb] });
  },
};
