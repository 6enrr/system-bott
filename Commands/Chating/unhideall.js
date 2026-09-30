const { ChannelType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "unhideall",
  description: "Unhide all text, voice channels, and categories for everyone",
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply("You do not have permission to use this command.");
    }

    const channels = message.guild.channels.cache;
    const updates = [];
    let count = 0;

    channels.forEach((ch) => {
      if (
        ch.type === ChannelType.GuildText ||
        ch.type === ChannelType.GuildVoice ||
        ch.type === ChannelType.GuildCategory
      ) {
        const hasOverwrite = ch.permissionOverwrites.cache.has(message.guild.id);
        if (hasOverwrite) {
          updates.push(
            ch.permissionOverwrites
              .edit(message.guild.id, { [PermissionFlagsBits.ViewChannel]: true })
              .then(() => count++)
              .catch((err) => console.error(`Failed to unhide ${ch.name}`, err))
          );
        }
      }
    });

    await Promise.all(updates);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(`Successfully unhide ${count} channel from everyone .`);

    message.channel.send({ embeds: [embed] });
  },
};
