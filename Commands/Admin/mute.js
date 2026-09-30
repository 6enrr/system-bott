const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "mute",
  aliases: ["اسكات"],
  run: async (client, message, args) => {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ModerateMembers
      )
    )
      return message.reply("ما عندك صلاحية.");

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member) return message.reply("منشن العضو.");

    const reason = args.slice(1).join(" ") || "بدون سبب";

    try {
      await member.timeout(60_000, reason); 
      db.set(`mute_${member.id}`, {
        by: message.author.id,
        reason,
        time: "1m",
      });
      message.reply(`✅ تم إسكات ${member.user.tag}`);
    } catch (e) {
      message.reply("ما قدرت أسكته.");
    }
  },
};
