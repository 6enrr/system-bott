const {
  EmbedBuilder,
  Colors,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "callow",
  description: "Allow a member to enter all voice channels",
  async run(client, message) {
    const member = message.mentions.members.first();

    const db = Pro.get(`Allow - Command callow = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (
      !isAuthorAllowed &&
      message.author.id !== db &&
      !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)
    ) return message.react("❌");

    if (!member) return message.reply("يرجى ذكر العضو الذي تريد السماح له.");

    const voiceChannels = message.guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildVoice
    );
    if (voiceChannels.size === 0) return message.reply("لا توجد قنوات صوتية في هذا الخادم.");

    try {
      for (const ch of voiceChannels.values()) {
        await ch.permissionOverwrites.edit(member, { Connect: true });
      }
      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle("تم تحديث إذن الدخول")
        .setDescription(`✅ ${member} صار قادرا على دخول جميع القنوات الصوتية.`)
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      return message.reply("حدث خطأ أثناء محاولة تحديث الأذونات.");
    }
  },
};
