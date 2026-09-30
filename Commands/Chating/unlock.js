const {
  PermissionsBitField,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "unlock",
  aliases: ["فتح", "ف"],
  run: async (client, message, args) => {
    const db = Pro.get(`Allow - Command unlock = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === db ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageChannels);

    if (!isAuthorAllowed) {
      return message.reply(`:rolling_eyes: **You Don't Have Permissions To unlock this channel.**`);
    }

    const botHasPerms = message.guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageChannels);
    const channel =
      message.mentions.channels.first() ||
      client.channels.cache.get(args[0]) ||
      message.channel;

    const everyone = message.guild.roles.everyone;

    if (channel.permissionsFor(everyone).has(PermissionsBitField.Flags.SendMessages)) {
      return message.reply(`:x: **Channel is already unlocked** ${channel}.`);
    }

    if (!botHasPerms) {
      return message.reply(`:rolling_eyes: **I couldn't change the channel permissions. Please check my permissions.**`);
    }

    await channel.permissionOverwrites.edit(everyone, {
      [PermissionFlagsBits.SendMessages]: true,
      [PermissionFlagsBits.SendMessagesInThreads]: true,
      [PermissionFlagsBits.CreatePublicThreads]: true,
      [PermissionFlagsBits.CreatePrivateThreads]: true,
    });

    message.reply(`:unlock: ${channel} **has been unlocked.**`).catch(() => {});
  },
};
