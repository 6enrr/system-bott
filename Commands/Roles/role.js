const { EmbedBuilder, PermissionsBitField, Colors } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "role",
  run: async (client, message, args) => {
    if (!message.guild) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      Colors.Blurple;

    const allowDb = Pro.get(`Allow - Command role = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === allowDb ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
      owners.includes(message.author.id);

    if (!isAuthorAllowed) return message.react("❌");

    if (args.length < 2) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة .\n role <@شخص> <@رول>**`
        );
      return message.reply({ embeds: [embed] });
    }

    const user =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[1]) ||
      message.guild.roles.cache.find((r) => r.name === args.slice(1).join(" "));

    if (!user || !role)
      return message.reply({
        content: "❌ لم يتم العثور على العضو أو الرتبة المطلوبة.",
      });

    const hasRole = user.roles.cache.has(role.id);
    try {
      if (hasRole) {
        await user.roles.remove(role);
      } else {
        await user.roles.add(role);
      }
      message.react("✅");
    } catch (err) {
      console.error(err);
      message.react("❌");
    }
  },
};
