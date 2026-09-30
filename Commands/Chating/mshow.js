const { PermissionsBitField, PermissionFlagsBits } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "mshow",
  aliases: ["mshow"],
  description: "إظهار الدردشة",
  usage: ["اظهار الدردشة"],
  run: async (client, message, args) => {
    const allowKey = Pro.get(`Allow - Command hide = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowKey);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === allowKey ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageChannels) ||
      owners.includes(message.author.id);

    if (!isAuthorAllowed) return;

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    let mentionedMember =
      message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!mentionedMember) {
      return message.reply("**.يرجى ارفاق منشن الشخص او الايدي**").catch(console.error);
    }

    message.channel.permissionOverwrites
      .edit(mentionedMember, { [PermissionFlagsBits.ViewChannel]: true })
      .then(() => message.react("✅").catch(() => {}))
      .catch(() => message.react("❌").catch(() => {}));
  },
};
