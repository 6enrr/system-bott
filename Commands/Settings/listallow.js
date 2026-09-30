const { EmbedBuilder, Colors } = require("discord.js");
const Pro = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "listallow",
  aliases: ["checkPermissions", "تاكيد"],
  description: "يعرض الصلاحيات المعينة للدور المحدد.",
  run: async function (client, message) {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const Color =
      Pro.get(`Guild_Color_${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#f5f5ff";

    const Args = message.content.split(" ");
    if (!Args[1]) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استخدام الأمر بالطريقة الصحيحة.**\n تأكيد <@&رول>`);
      return message.reply({ embeds: [embed] });
    }

    const role = message.mentions.roles.first() || message.guild.roles.cache.get(Args[1]);
    if (!role) {
      const embed = new EmbedBuilder().setColor(Color).setDescription("**يرجى ارفاق منشن صحيح للرول.**");
      return message.reply({ embeds: [embed] });
    }

    const permissions = [
      { name: "حظر وفك", value: "ban" },
      { name: "الطرد", value: "kick" },
      { name: "السجن", value: "prison" },
      { name: "الأسكاتي الكتابي", value: "mute" },
      { name: "الميوت الصوتي", value: "vmute" },
      { name: "اعطاء إزالة رول", value: "role" },
      { name: "اعطاء إزالة إنشاء, رول للجميع", value: "allrole" },
      { name: "الرولات الخاصة", value: "srole" },
      { name: "المسح", value: "clear" },
      { name: "الصور ،الهير ،الكام", value: "pic" },
      { name: "سحب ،ودني", value: "move" },
      { name: "قفل فتح", value: "lock" },
      { name: "اخفاء اظهار", value: "hide" },
      { name: "معلومات الرول", value: "check" },
      { name: "اوامر الانذارات", value: "warn" },
      { name: "إزالة إضافة الكنية", value: "setnick" },
    ];

    const granted = permissions.filter(
      (p) => Pro.get(`Allow - Command ${p.value} = [ ${message.guild.id} ]`) === role.id
    );

    if (granted.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**لا توجد صلاحيات مُعينة لدور** ${role.name} **في الوقت الحالي.**`);
      return message.reply({ embeds: [embed] });
    }

    const out = new EmbedBuilder()
      .setColor(Color || Colors.Blurple)
      .setTitle(`الصلاحيات المعينة لدور ${role.name}`)
      .setDescription(granted.map((p) => `**✅ | ${p.name}**`).join("\n"))
      .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    return message.reply({ embeds: [out] });
  },
};
