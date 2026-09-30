const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");
const moment = require("moment");

module.exports = {
  name: "records",
  aliases: ["سجلات"],
  run: async (client, message, args) => {
    const allowId = Pro.get(
      `Allow - Command records = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowId);

    const canUse =
      message.member.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      ) ||
      message.member.roles.cache.has(allowRole?.id);

    if (!canUse)
      return message.reply("ما عندك إذن.");

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#f5f5ff")
            .setDescription(
              `استعمل:\n records @عضو`
            ),
        ],
      });
    }

    const types = [
      {
        key: "Muted_Members",
        title: "كتم",
        timeKey: "times",
      },
      {
        key: "Timeout_Members",
        title: "تايم أوت",
        timeKey: "endsAt",
      },
      {
        key: "Prisoned_Members",
        title: "سجن",
        timeKey: "endDate",
      },
    ];

    const all = [];

    types.forEach((t) => {
      const arr = Pro.get(`${t.key}_${member.id}`) || [];
      arr.forEach((rec) => {
        all.push(
          `**${t.title}**\nالسبب: ${rec.reason}\nبواسطة: <@${rec.by}>\nالنهاية: ${moment(
            rec[t.timeKey]
          ).format("LLLL")}`
        );
      });
    });

    if (!all.length) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#f5f5ff")
            .setDescription(
              `مافي سجلات على ${member}`
            ),
        ],
      });
    }

    const emb = new EmbedBuilder()
      .setColor("#f5f5ff")
      .setTitle(`سجلات ${member.user.username}`)
      .setDescription(all.join("\n\n"));

    message.channel.send({ embeds: [emb] });
  },
};
