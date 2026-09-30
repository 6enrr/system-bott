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

  const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: 10 }).catch(() => null);
  const entry = logs?.entries.first();
  const userID = entry?.executor?.id;
  if (!userID) return; 

  const user = await client.users.fetch(userID).catch(() => null);
  if (!user) return;

  const channelCreate = new Discord.MessageEmbed()
    .setAuthor(user.username, user.avatarURL({ dynamic: true }))
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1093303174774927511/1138891156818772018/8C926555-671C-4F9C-9136-DAD2229375B4.png"
    )
    .setDescription(
      `**إنشاء قناة**\n\n**بواسطة : <@${userID}>**\n**قناة : <#${channel.id}>**\n**نوع : ${roomType}**\n`
    )
    .setColor("#524053")
    .setFooter(client.user.username, client.user.displayAvatarURL());

  logChannel.send({ embeds: [channelCreate] });
};
