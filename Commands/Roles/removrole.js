const { EmbedBuilder, PermissionsBitField, Colors } = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "roleremove",
  aliases: ["rr"],
  run: async (client, message, args) => {
    if (!message.guild) return;

    const db = Pro.get(`Allow-Command-roleremove-${message.guild.id}`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === db ||
      message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!isAuthorAllowed) return message.react("❌");

    for (const roleArg of args) {
      const role = message.guild.roles.cache.find((r) =>
        r.name.toLowerCase().includes(roleArg.toLowerCase().trim())
      );
      if (!role)
        return message.reply("يرجى كتابة اسم رول صحيح لإزالته.");

      let count = 0;
      for (const member of message.guild.members.cache.values()) {
        if (member.roles.cache.has(role.id)) {
          try {
            await member.roles.remove(role);
            count++;
          } catch (e) {
            console.error(e);
          }
        }
      }

      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription(`✅ تمت إزالة الرتبة **${role.name}** من **${count}** عضو.`);
      return message.reply({ embeds: [embed] });
    }
  },
};
