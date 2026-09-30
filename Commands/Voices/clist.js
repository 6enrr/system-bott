const {
  EmbedBuilder,
  Colors,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "clist",
  description: "List members denied access to all voice channels",
  async run(client, message) {
    const db = Pro.get(`Allow - Command clist = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (
      !isAuthorAllowed &&
      message.author.id !== db &&
      !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)
    ) return message.react("❌");

    const voiceChannels = message.guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildVoice
    );
    if (voiceChannels.size === 0) return message.reply("لا توجد قنوات صوتية في هذا السيرفر.");

    const deniedMembers = new Set();

    voiceChannels.forEach((channel) => {
      channel.permissionOverwrites.cache
        .filter(
          (ow) =>
            ow.type === 1 && 
            ow.deny.has(PermissionsBitField.Flags.Connect)
        )
        .forEach((ow) => deniedMembers.add(ow.id));
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle("قائمة الأعضاء الممنوعين من الوصول")
      .setDescription("الاعضاء الذين منعوا من الوصول الى القنوات الصوتية:")
      .setTimestamp();

    if (deniedMembers.size === 0) {
      embed.setDescription("لا يوجد اعضاء ممنوعون من الوصول إلى اي قنوات صوتية.");
    } else {
      const membersList =
        Array.from(deniedMembers)
          .map((id) => message.guild.members.cache.get(id)?.user.tag)
          .filter(Boolean)
          .join(", ") || "لا توجد أعضاء";
      embed.addFields({ name: "الأعضاء الممنوعون:", value: membersList });
    }

    return message.channel.send({ embeds: [embed] });
  },
};
