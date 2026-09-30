const { EmbedBuilder, PermissionsBitField, Colors } = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "editrole",
  aliases: ["editrol", "er"],
  run: async (client, message, args) => {
    if (!message.guild) return;

    const guildColor =
      db.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      Colors.Blurple;

    const allowDb = db.get(`Allow - Command editrole = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === allowDb ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageRoles);

    if (!isAuthorAllowed)
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription("❌ ليس لديك صلاحية لاستخدام هذا الأمر."),
        ],
      });

    if (args.length < 2) {
      const embed = new EmbedBuilder()
        .setColor(guildColor)
        .setTitle("Command: editrole")
        .setDescription("تعديل اسم رتبة موجودة بالسيرفر.")
        .addFields(
          { name: "Aliases:", value: module.exports.aliases.join(", ") || "None" },
          { name: "Usage:", value: ` editrole [الاسم القديم] [الاسم الجديد]` },
          { name: "Example:", value: ` editrole oldRole newRole` }
        );
      return message.reply({ embeds: [embed] });
    }

    const roleName = args[0];
    const newRoleName = args.slice(1).join(" ");
    const role = message.guild.roles.cache.find(
      (r) => r.name.toLowerCase() === roleName.toLowerCase()
    );

    if (!role)
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(`❌ الرتبة "${roleName}" غير موجودة.`),
        ],
      });

    if (message.guild.members.me.roles.highest.position <= role.position)
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription(`❌ لا يمكن تعديل الرتبة "${roleName}" لأنها أعلى من رتبة البوت.`),
        ],
      });

    try {
      await role.setName(newRoleName);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`✅ تم تغيير اسم الرتبة من **${roleName}** إلى **${newRoleName}**.`),
        ],
      });
    } catch (e) {
      console.error(e);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setDescription("❌ حدث خطأ أثناء تعديل اسم الرتبة."),
        ],
      });
    }
  },
};
