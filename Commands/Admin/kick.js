const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "kick",
  aliases: ["طرد"],
  run: async (client, message, args) => {
    const Color =
      db.get(`Guild_Color_${message.guild.id}`) || "#5c5e64";

    if (
      !message.member.permissions.has(PermissionsBitField.Flags.KickMembers)
    ) {
      return message.reply("ما عندك صلاحية للطرد!");
    }

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member)
      return message.reply(
        `استعمل:\n kick @عضو [السبب]`
      );

    const reason = args.slice(1).join(" ") || "بدون سبب";

    try {
      await member.kick(reason);
      const emb = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `✅ تم طرد ${member.user.tag}\nالسبب: ${reason}`
        );
      message.channel.send({ embeds: [emb] });
    } catch (e) {
      message.reply("ما قدرت أطرده، يمكن رتبتك أقل.");
    }
  },
};
