const { PermissionsBitField, PermissionFlagsBits } = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "unhide",
  aliases: ["اظهار"],
  description: "Show chat",
  run: async (client, message) => {
    const allowedRoleId = Pro.get(`Allow - Command hide = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowedRoleId);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === allowedRoleId ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageChannels);

    if (!isAuthorAllowed) {
      return message.reply("You do not have permission to unhide this channel.");
    }

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return message.reply("This command is currently disabled.");

    const everyone = message.guild.roles.everyone;

    try {
      await message.channel.permissionOverwrites.edit(everyone, {
        [PermissionFlagsBits.ViewChannel]: true,
      });
      message.reply(`:white_check_mark: Channel **${message.channel.name}** was unhidden by **${message.author.tag}!**`);
    } catch (err) {
      console.error(`Failed to unhide the channel: ${err.message}`);
      message.reply("There was an error un-hiding the channel.");
    }
  },
};
