const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "pic",
  aliases: ["صور"],
  run: async (client, message, args) => {
    if (!message.guild || message.author.bot) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#000000";

    const db = Pro.get(`Allow - Command pic = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === db ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageRoles);

    if (!isAuthorAllowed) return message.react("❌");

    const user =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!user) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة .\n صور <@عضو>**`
        );
      return message.reply({ embeds: [embed] });
    }

    const reason = `<@!${message.author.id}>`;
    const roleName = "Pic";

    let picRole = message.guild.roles.cache.find((r) => r.name === roleName);
    if (!picRole) {
      picRole = await message.guild.roles.create({
        name: roleName,
        reason: "Creating Pic role",
        permissions: [PermissionsBitField.Flags.AttachFiles],
      });
    }

    if (user.roles.cache.has(picRole.id)) {
      await user.roles.remove(picRole, reason);
    } else {
      await user.roles.add(picRole, reason);
    }

    message.react("✅");
  },
};
