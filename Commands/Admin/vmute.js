const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "vmute",
  aliases: ["ميوت-صوتي"],
  run: async (client, message, args) => {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.MuteMembers
      )
    )
      return message.reply("ما عندك صلاحية.");

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member)
      return message.reply("منشن العضو.");

    if (!member.voice.channel)
      return message.reply("العضو مو في روم صوتي.");

    await member.voice.setMute(true, "Voice mute").catch(() => {});
    db.set(`vmute_${member.id}`, {
      by: message.author.id,
      time: new Date(),
    });

    const emb = new EmbedBuilder()
      .setColor("#5c5e64")
      .setDescription(`✅ تم ميوت صوتي لـ ${member}`);

    message.channel.send({ embeds: [emb] });
  },
};
