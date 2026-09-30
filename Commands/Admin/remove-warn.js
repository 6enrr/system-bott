const {
  PermissionsBitField,
} = require("discord.js");
const d1b = require("pro.db");

module.exports = {
  name: "remove-warn",
  aliases: ["شيل", "rwarn"],
  description: "يزيل تحذير أو كل تحذيرات عضو",
  run: async (client, message, args) => {
    const isEnabled = d1b.get(`command_enabled_remove-warn`);
    if (isEnabled === false) return;

    const allowVal = d1b.get(
      `Allow - Command warn = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowVal);
    const canUse =
      message.member.roles.cache.has(allowRole?.id) ||
      message.author.id === allowVal ||
      message.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      );
    if (!canUse) return;

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!member) {
      return message.reply({
        content: "🙄 **يرجى الإشارة إلى العضو أو الأيدي**",
      });
    }

    const current = d1b.get(`warns_${member.id}`);
    if (!current) {
      return message.reply({
        content: `👌 **${member.user.username} لا يملك أي تحذيرات.**`,
      });
    }

    if (!args[1]) {
      d1b.delete(`warns_${member.id}`);
      return message.reply({
        content: `✅ **تمت إزالة \`${current}\` تحذير/تحذيرات من ${member}**`,
      });
    }

    const howMany = parseInt(args[1]);
    if (isNaN(howMany) || howMany <= 0) {
      return message.reply("اكتب رقم صحيح.");
    }

    const toRemove = Math.min(howMany, current);
    d1b.subtract(`warns_${member.id}`, toRemove);

    return message.reply(
      `✅ **تمت إزالة ${toRemove} تحذير/تحذيرات من ${member}**`
    );
  },
};
