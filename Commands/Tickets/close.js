const { EmbedBuilder, Colors } = require("discord.js");
const Data = require("pro.db");
const { createTranscript } = require("discord-html-transcripts");

module.exports = {
  name: "close",
  aliases: ["إغلاق", "اغلاق"],
  run: async (client, message) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    try {
      const roleId = Data.get(`Role = [${message.guild.id}]`);
      if (!roleId || !message.member.roles.cache.has(roleId)) return;

      const Color = Data.get(`Guild_Color = ${message.guild?.id}`) ||
                    message.guild.members.me?.displayHexColor || Colors.Blurple;

      if (!Data.has(`channel${message.channel.id}`)) return message.react("❌");

      const memberId = Data.get(`channel${message.channel.id}`);
      const member = await message.guild.members.fetch(memberId);

      Data.delete(`channel${message.channel.id}`);
      Data.delete(`member${member.id}`);

      const ticketName = message.channel.name;

      setTimeout(async () => {
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
        if (!logChannel) return console.error("لا يمكن العثور على روم اللوج!");

        const embed = new EmbedBuilder()
          .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ size: 1024 }) })
          .setColor(Color)
          .setDescription(`**إغلاق تذكرة\n\nتذكرة  <@${member.user.id}>\nأغلقها : <@${message.author.id}>\nاسم التذكرة  ${ticketName}**`)
          .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
          .setTimestamp();

        await logChannel.send({ embeds: [embed], files: [{ attachment: transcript, name: `${message.channel.name}.html` }] });
        await message.channel.delete();
      }, 5000);

      await message.reply("**🎫 سيتم حذف التذكرة خلال ثواني**").catch(() => {});
    } catch (e) {
      console.error("close error:", e);
    }
  },
};
