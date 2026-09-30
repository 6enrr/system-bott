const { EmbedBuilder, Colors } = require("discord.js");
const Data = require("pro.db");
const { createTranscript } = require("discord-html-transcripts");

module.exports = {
  name: "autoclose",
  aliases: ["اغلاق-تلقائي"],
  description: "إغلاق التذكرة تلقائيًا بعد مدة معينة (بالدقائق)",
  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;
    if (!message.guild) return;

    try {
      const roleId = Data.get(`Role = [${message.guild.id}]`);
      if (!roleId || !message.member.roles.cache.has(roleId)) return;

      if (!Data.has(`channel${message.channel.id}`))
        return message.reply("**هذه ليست تذكرة. ❌**");

      const Color =
        Data.get(`Guild_Color = ${message.guild.id}`) ||
        message.guild.members.me?.displayHexColor ||
        Colors.Blurple;

      const minutes = parseInt(args[0]) || 5;
      if (isNaN(minutes) || minutes <= 0)
        return message.reply("**يرجى إدخال عدد دقائق صحيح. ⏱️**");

      await message.reply(
        `**سيتم إغلاق هذه التذكرة تلقائيًا بعد \`${minutes}\` دقيقة، إن لم يتم إلغاؤها يدويًا. ⏳**`
      );

      setTimeout(async () => {
        try {
          if (!Data.has(`channel${message.channel.id}`)) return; 

          const memberId = Data.get(`channel${message.channel.id}`);
          const member = await message.guild.members
            .fetch(memberId)
            .catch(() => null);
          if (!member) return;

          Data.delete(`channel${message.channel.id}`);
          Data.delete(`member${member.id}`);

          const ticketName = message.channel.name;

          const transcript = await createTranscript(message.channel, {
            returnType: "buffer",
            minify: true,
            saveImages: true,
            useCDN: true,
            poweredBy: false,
            fileName: `${message.channel.name}.html`,
          });

          const logChannelId = Data.get(`Channel = [${message.guild.id}]`);
          const logChannel = message.guild.channels.cache.get(logChannelId);
          if (!logChannel) return;

          const claimId = Data.get(`claim${message.channel.id}`);

          const embed = new EmbedBuilder()
            .setAuthor({
              name: member.user.tag,
              iconURL: member.user.displayAvatarURL({ size: 1024 }),
            })
            .setColor(Color)
            .setDescription(
              `**إغلاق تلقائي للتذكرة**\n\n` +
                `**تذكرة : <@${member.user.id}>**\n` +
                `**اسم التذكرة : ${ticketName}**\n` +
                (claimId
                  ? `**الموظف المستلم (Claim): <@${claimId}>**\n`
                  : "") +
                `**نوع الإغلاق : Auto Close**`
            )
            .setFooter({
              text: message.guild.name,
              iconURL: message.guild.iconURL(),
            })
            .setTimestamp();

          await logChannel.send({
            embeds: [embed],
            files: [
              { attachment: transcript, name: `${message.channel.name}.html` },
            ],
          });

          await message.channel.delete().catch(() => {});
        } catch (e) {
          console.error("autoclose timeout error:", e);
        }
      }, minutes * 60 * 1000);
    } catch (e) {
      console.error("autoclose error:", e);
    }
  },
};
