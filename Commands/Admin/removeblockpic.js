const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "removeblockpic",
  run: async (client, message, args) => {
    const roleId = db.get(
      `Allow - Command removeblockpic = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(roleId);

    const canUse =
      message.member.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      ) ||
      message.member.roles.cache.has(allowRole?.id);

    if (!canUse)
      return message.reply("ما عندك إذن.");

    const user = message.mentions.users.first();
    if (!user) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              `استعمل:\n removeblockpic @عضو`
            ),
        ],
      });
    }

    const blocked =
      db.get(`blocked_pics_${message.guild.id}`) || [];

    if (!blocked.includes(user.id)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ffcc00")
            .setDescription("العضو مو محظور اصلاً."),
        ],
      });
    }

    const newList = blocked.filter((id) => id !== user.id);
    db.set(`blocked_pics_${message.guild.id}`, newList);

    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#0099ff")
          .setDescription(
            `تم فك حظر الصور عن ${user} ✅`
          ),
      ],
    });
  },
};
