const { EmbedBuilder, PermissionsBitField, Colors } = require("discord.js");
const Pro = require(`pro.db`);
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "addrole",
  run: async (client, message) => {
    if (!message.guild) return;

    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || Colors.Blurple;
    const db = Pro.get(`Allow - Command allrole = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === db ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
      owners.includes(message.author.id);

    if (!isAuthorAllowed) return message.react("❌");

    const roleName = message.content.slice(8).trim();
    if (!roleName) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n addrole اسم الرول**`);
      return message.reply({ embeds: [embed] });
    }

    try {
      await message.guild.roles.create({ name: roleName });
      return message.react("✅");
    } catch (err) {
      console.error(err);
      return message.react("❌");
    }
  },
};
