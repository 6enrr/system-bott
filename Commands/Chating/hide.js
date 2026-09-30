const { PermissionsBitField, PermissionFlagsBits } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "hide",
  aliases: ["اخفاء"],
  description: "إخفاء الشات عن الجميع",
  usage: ["hide chat"],
  run: async (client, message) => {
    const allowKey = Pro.get(`Allow - Command hide = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowKey);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === allowKey ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageChannels) ||
      owners.includes(message.author.id);

    if (!isAuthorAllowed) {
      return message.reply("You do not have permission to use this command.");
    }

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return message.reply("This command is disabled.");
    }

    const everyone = message.guild.roles.everyone;

    try {
      await message.channel.permissionOverwrites.edit(everyone, {
        [PermissionFlagsBits.ViewChannel]: false,
      });
      message.reply(
        `:white_check_mark: Channel **${message.channel.name}** was hidden by **${message.author.tag}!**`
      );
    } catch (err) {
      console.error(`Failed to hide the channel: ${err.message}`);
      message.reply("There was an error hiding the channel.");
    }
  },
};
