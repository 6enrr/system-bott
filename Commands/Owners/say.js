const { AttachmentBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Data = require("pro.db");

module.exports = {
  name: "say",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    if (message.author.bot || !message.guild) return;

    if (!message.guild.members.me?.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("**لا استطيع إرسال الرسالة.**");
    }

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    const content = args.slice(1).join(" ");
    const attach = message.attachments.first();

    if (!channel) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n say <#${message.channel.id}> رسالة أو صورة**`);
      return message.reply({ embeds: [embed] });
    }

    if (!content && !attach) return message.reply("**يرجى إرسال الرسالة أو رفع صورة**");

    await message.delete().catch(() => {});
    try {
      if (attach) {
        const attachment = new AttachmentBuilder(attach.url);
        await channel.send({ content: content || " ", files: [attachment] });
      } else {
        await channel.send({ content: content || " " });
      }
    } catch (e) {
      console.error(e);
      return message.reply("**حدث خطأ أثناء إرسال الرسالة**");
    }
  },
};
