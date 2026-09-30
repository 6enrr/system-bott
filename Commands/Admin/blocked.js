const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "blocked",
  run: async (client, message) => {
    const roleId = db.get(
      `Allow - Command blocked = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(roleId);

    const canUse =
      message.member.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      ) ||
      message.member.roles.cache.has(allowRole?.id);

    if (!canUse)
      return message.reply("ما عندك إذن.");

    const blocked =
      db.get(`blocked_pics_${message.guild.id}`) || [];

    if (!blocked.length) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ffcc00")
            .setTitle("مافي أحد محظور صور"),
        ],
      });
    }

    const emb = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("المحظورين من الصور")
      .setDescription(blocked.map((id) => `<@${id}>`).join(", "));

    message.channel.send({ embeds: [emb] });
  },
};
