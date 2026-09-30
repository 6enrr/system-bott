const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Pro = require(`pro.db`);
const Data = require(`pro.db`);
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "srole",
  run: async (client, message) => {
    if (!message.guild) return;

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';

    const db = Pro.get(`Allow - Command srole = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === db ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageRoles);

    if (!isAuthorAllowed) return;

    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n srole <@${message.author.id}> rose**`);
      return message.reply({ embeds: [embed] });
    }

    const afterMention = message.content.indexOf(mentionedUser.toString());
    const roleName = afterMention >= 0
      ? message.content.slice(afterMention + mentionedUser.toString().length).trim()
      : "";

    if (!roleName) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n srole <@${message.author.id}> rose**`);
      return message.reply({ embeds: [embed] });
    }

    const member = message.guild.members.cache.get(mentionedUser.id);
    if (!member) return message.reply("**لا يمكن العثور على العضو .**");

    const userRoles = Pro.get(`userRoles_${member.id}`) || [];
    if (userRoles.length > 0) {
      return message.reply("**يمتلك رول خاص بالفعل.**");
    }

    try {
      const role = await message.guild.roles.create({ name: roleName, reason: `Private role for ${member.user.tag}` });
      await member.roles.add(role).catch(() => {});
      Pro.set(`userRoles_${member.id}`, [role.id]);
      return message.react("✅");
    } catch {
      return message.react("❌");
    }
  },
};
