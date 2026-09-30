const {
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const deb = require("pro.db");

module.exports = {
  name: "warnings",
  aliases: ["تحذيرات", "warni"],
  description: "يشوف تحذيرات عضو",
  run: async (client, message, args) => {
    const isEnabled = deb.get(`command_enabled_warnings`);
    if (isEnabled === false) return;

    const Color =
      deb.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";

    const allowVal = deb.get(
      `Allow - Command warn = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowVal);
    const canUse =
      message.member.roles.cache.has(allowRole?.id) ||
      message.author.id === allowVal ||
      message.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      );
    if (!canUse) return;

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!member) {
      return message.reply({
        content: "**يرجى ارفاق منشن العضو او الايدي .**",
        allowedMentions: { parse: [] },
      });
    }

    const warns = await deb.fetch(`warns_${member.id}`);
    if (!warns) {
      return message.reply({
        content: "> **هذا المستخدم لا يملك تحذيرات**",
        allowedMentions: { parse: [] },
      });
    }

    const warnedby = deb.get(`messageauthor_${member.id}`);
    const reason = deb.get(`reason_${member.id}`) || "غير محدد";

    const embed = new EmbedBuilder()
      .setColor(Color)
      .setAuthor({
        name: message.guild.name,
        iconURL: message.guild.iconURL(),
      })
      .setThumbnail(member.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `طلب بواسطة ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(
        `**العضو:** ${member}\n**عدد التحذيرات:** \`${warns}\`\n**آخر تحذير من:** ${
          warnedby ? `<@${warnedby}>` : "غير معروف"
        }\n**آخر سبب:** \`${reason}\``
      );

    message.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  },
};
