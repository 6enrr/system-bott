const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "nick",
  aliases: ["نك"],
  run: async (client, message, args) => {
    if (!message.guild || message.author.bot) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#f5f5ff";

    const db = Pro.get(`Allow - Command pic = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === db ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageRoles);

    if (!isAuthorAllowed) return;

    const user =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!user) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة .\n nick <@عضو>**`
        );
      return message.reply({ embeds: [embed] });
    }

    const key = `Nick = ${message.guild.id}`;
    let nickRole = Pro.get(key)
      ? message.guild.roles.cache.get(Pro.get(key))
      : null;

    if (!nickRole) {
      nickRole = await message.guild.roles.create({
        name: "Nick",
        reason: "Auto role for nick command",
        permissions: [PermissionsBitField.Flags.ManageNicknames],
      });
      Pro.set(key, nickRole.id);
    }

    if (user.roles.cache.has(nickRole.id)) {
      await user.roles.remove(nickRole);
    } else {
      await user.roles.add(nickRole);
    }

    message.react("✅");
  },
};
