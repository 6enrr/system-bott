const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Pro = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "dsrole",
  run: async (client, message) => {
    if (!message.guild) return;

    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";

    const allowDb = Pro.get(`Allow - Command srole = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === allowDb ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageRoles);

    if (!isAuthorAllowed) return;

    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
      const noUserEmbed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n dsrole <@${message.author.id}>**`);
      return message.reply({ embeds: [noUserEmbed] });
    }

    const member = message.guild.members.cache.get(mentionedUser.id);
    if (!member) return message.react("❌");

    const userRoles = Pro.get(`userRoles_${member.id}`) || [];

    if (userRoles.length > 0) {
      for (const roleId of userRoles) {
        const role = message.guild.roles.cache.get(roleId);
        if (role) {
          await member.roles.remove(role).catch(() => {});
        }
      }
      Pro.delete(`userRoles_${member.id}`);
      return message.react("✅");
    } else {
      const noRolesEmbed = new EmbedBuilder()
        .setColor(Color)
        .setDescription("**العضو ليس لديه رول خاص.**");
      return message.reply({ embeds: [noRolesEmbed] });
    }
  },
};
