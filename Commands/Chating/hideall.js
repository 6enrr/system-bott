const { ChannelType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "hideall",
  description: "Hide all chat, voice channels, and categories from everyone",
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply("You don't have permission to manage channels.");
    }

    const guild = message.guild;
    const channels = guild.channels.cache;
    let hiddenCount = 0;

    const ops = [];
    channels.forEach((ch) => {
      if (
        ch.type === ChannelType.GuildText ||
        ch.type === ChannelType.GuildVoice ||
        ch.type === ChannelType.GuildCategory
      ) {
        ops.push(
          ch.permissionOverwrites
            .edit(guild.roles.everyone, { [PermissionFlagsBits.ViewChannel]: false })
            .then(() => hiddenCount++)
            .catch((err) => console.error(`Failed to hide ${ch.name}:`, err))
        );
      }
    });

    await Promise.all(ops);

    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setDescription(`Successfully hidden ${hiddenCount} channels from everyone.`);
    message.channel.send({ embeds: [embed] });
  },
};
