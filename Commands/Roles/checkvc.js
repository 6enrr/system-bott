const { PermissionsBitField } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);

module.exports = {
  name: 'checkvc',
  run: (client, message) => {
    if (!message.guild) return;

    const db = Pro.get(`Allow - Command check = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === db ||
      message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
      owners.includes(message.author.id);

    if (!isAuthorAllowed) return message.react('❌');

    const args = message.content.trim().split(/\s+/);
    const roleIdOrMentionOrName = args[1];
    const role = message.guild.roles.cache.find(
      (e) => e.id === roleIdOrMentionOrName ||
             e.name === roleIdOrMentionOrName ||
             `<@&${e.id}>` === roleIdOrMentionOrName
    );

    if (!role) {
      return message.reply({ content: `**يرجى ارفاق منشن الرول او الايدي **` });
    }

    const roleMembers = Array.from(role.members.values());
    const roleMemberCount = roleMembers.length;

    const voiceChannelCount = roleMembers.filter(m => !!m.voice?.channelId).length;

    const firstChunk = roleMembers.slice(0, 25).map((member, idx) => {
      const voiceEmoji = member.voice?.channelId ? '🔊' : '';
      return `${idx + 1}- <@${member.user.id}> ${voiceEmoji}`;
    }).join("\n");

    const remainingMembers = roleMembers.slice(25);
    const remainingChunk = remainingMembers.map((member, idx) => {
      const voiceEmoji = member.voice?.channelId ? '🔊' : '';
      return `${idx + 26}- <@${member.user.id}> ${voiceEmoji}`;
    }).join("\n");

    message.channel.send({
      content: `**الرول يحتوي على : \`${roleMemberCount}\`\nالمتواجدين بالرومات : \`${voiceChannelCount}\`\n${firstChunk || ''}**`
    });

    if (remainingMembers.length > 0) {
      message.channel.send({ content: `**${remainingChunk}**` });
    }
  }
};
