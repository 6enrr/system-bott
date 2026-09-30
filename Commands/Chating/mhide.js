const { EmbedBuilder, PermissionsBitField, PermissionFlagsBits } = require("discord.js");
const { owners, prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "mhide",
  description: "إخفاء الدردشة لعضو محدد",
  usage: ["اخفاء الدردشة"],
  run: async (client, message, args) => {
    const db = Pro.get(`Allow - Command hide = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === db ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageChannels) ||
      owners.includes(message.author.id);

    if (!isAuthorAllowed) return;

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    let mentionedMember =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!mentionedMember) {
      return message.reply("**.يرجى ارفاق منشن الشخص او الايدي**").catch(console.error);
    }

    message.channel.permissionOverwrites
      .edit(mentionedMember, { [PermissionFlagsBits.ViewChannel]: false })
      .then(() => message.react("✅"))
      .catch(() => message.react("❌"));
  },
};
