const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "embed",
  aliases: ["embedmsg", "makeembed"],
  run: async (client, message, args) => {
    const me = message.guild.members.me;
    if (!message.guild || !me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return message.reply("ليس لدي أذونات لإرسال الرسائل في هذه القناة.");
    }

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("ليس لديك الأذونات اللازمة لاستخدام هذا الأمر.");
    }

    if (!args.length) {
      return message.reply(`يرجى إدخال النص الذي تريد تحويله إلى Embed. يُستخدم الأمر كالتالي:  embed <النص>`);
    }

    const embedContent = args.join(" ");
    const Color =
      Pro.get(`Guild_Color_${message.guild.id}`) ||
      me.displayHexColor ||
      "#000000";

    const embed = new EmbedBuilder()
      .setColor(Color)
      .setDescription(embedContent)
      .setTimestamp()
      .setFooter({ text: `Server: ${message.guild.name}`, iconURL: message.guild.iconURL() })
      .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() });

    try {
      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      return message.reply("حدث خطأ أثناء إرسال الـ Embed. يرجى المحاولة لاحقًا.");
    }
  },
};
