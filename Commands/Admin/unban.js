const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "unban",
  aliases: ["فك", "unbanuser"],
  run: async (client, message, args) => {
    const enabled = Pro.get(`command_enabled_unban`);
    if (enabled === false) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";

    const allowId = Pro.get(
      `Allow - Command ban = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowId);

    const canUse =
      message.member.permissions.has(
        PermissionsBitField.Flags.BanMembers
      ) ||
      message.member.roles.cache.has(allowRole?.id) ||
      message.author.id === allowId;

    if (!canUse) return;

    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.Flags.BanMembers
      )
    ) {
      return message.reply("ما عندي صلاحية فك باند.");
    }

    const arg = args[0];
    if (!arg) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Color)
            .setDescription(
              `استعمل:\n unban <id>`
            ),
        ],
      });
    }

    const userId = arg.match(/\d+/) ? arg.match(/\d+/)[0] : arg;

    message.guild.members
      .unban(userId)
      .then(() => {
        message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Color)
              .setDescription(
                `تم فك الحظر عن <@${userId}> ✅`
              ),
          ],
        });

        const logId = Pro.get(
          `logbanunban_${message.guild.id}`
        );
        const logCh = message.guild.channels.cache.get(logId);
        if (logCh) {
          const e = new EmbedBuilder()
            .setColor("#880013")
            .setAuthor({
              name: message.author.tag,
              iconURL: message.author.displayAvatarURL({
                dynamic: true,
              }),
            })
            .setDescription(
              `**تم فك حظر العضو**\nلـ: <@${userId}>\nبواسطة: ${message.author}`
            );
          logCh.send({ embeds: [e] }).catch(() => {});
        }
      })
      .catch(() => {
        message.reply("ما قدرت أفك الحظر، يمكن ما هو مبند.");
      });
  },
};
