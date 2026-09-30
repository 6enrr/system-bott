const db = require("pro.db");
const humanizeDuration = require("humanize-duration");
const Discord = require("discord.js");
const { PermissionsBitField, ChannelType } = require("discord.js");

module.exports = async (client, channel) => {
  if (!channel.guild) return;

  const me = channel.guild.members.me;
  if (!me) return;

  if (!me.permissions.has(PermissionsBitField.Flags.EmbedLinks)) return;
  if (!me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return;

  const logchannels = db.get(`logchannels_${channel.guild.id}`);
  const logChannel = channel.guild.channels.cache.get(logchannels);
  if (!logChannel) return;

  let roomType = "Unknown";
  if (channel.type === ChannelType.GuildText) roomType = "Text";
  else if (channel.type === ChannelType.GuildVoice) roomType = "Voice";
  else if (channel.type === ChannelType.GuildCategory) roomType = "Category";

  const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: 12 }).catch(() => null);
  const entry = logs?.entries.first();
  const userID = entry?.executor?.id;
  if (!userID) return;

  const user = await client.users.fetch(userID).catch(() => null);
  if (!user) return;

  const channelDelete = new Discord.MessageEmbed()
    .setAuthor(user.username, user.avatarURL({ dynamic: true }))
    .setDescription(
      `**حذف القناة**\n\n**By : <@${userID}>**\n**قناة : ${channel.name}**\n**نوع : ${roomType}**\n`
    )
    .setColor("#524053")
    .setTimestamp()
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1064318878412451921/1179130626180386926/Channel-Delete.png"
    )
    .setFooter(client.user.username, client.user.displayAvatarURL());

  logChannel.send({ embeds: [channelDelete] });
};
