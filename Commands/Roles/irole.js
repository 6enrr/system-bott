const { EmbedBuilder, PermissionsBitField, Colors } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "roleicon",
  aliases: ["setroleicon", "seticon"],
  run: async (client, message, args) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return message.reply("❌ ليس لديك صلاحية لإدارة الرتب.");

    if (args.length < 2)
      return message.reply(
        `**الاستخدام:** \` roleicon <@رول> <رابط صورة>\``
      );

    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[0]);
    const iconUrl = args[1];

    if (!role) return message.reply("❌ الرجاء تحديد رول صالح.");
    if (!iconUrl.match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)$/))
      return message.reply("❌ الرجاء إرسال رابط صورة صالح.");

    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.Flags.ManageRoles
      )
    )
      return message.reply("❌ لا أمتلك صلاحية إدارة الرتب.");

    if (
      role.position >= message.guild.members.me.roles.highest.position
    )
      return message.reply("❌ لا يمكنني تعديل رتبة أعلى من رتبتي.");

    try {
      await role.setIcon(iconUrl);
      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setDescription(`✅ تم تغيير صورة الرتبة **${role.name}** بنجاح.`);
      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply("❌ حدث خطأ أثناء تعديل صورة الرتبة.");
    }
  },
};
