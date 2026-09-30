const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "allbans",
  aliases: ["bans"],
  run: async (client, message) => {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.BanMembers)
    )
      return message.reply("ما عندك صلاحية.");

    const bans = await message.guild.bans.fetch().catch(() => null);
    if (!bans || !bans.size)
      return message.reply("مافي أحد مبند.");

    const emb = new EmbedBuilder()
      .setColor("#5c5e64")
      .setTitle("قائمة المبندين")
      .setDescription(
        bans
          .map((b) => `**${b.user.tag}** — ${b.reason || "بدون سبب"}`)
          .join("\n")
      );

    message.channel.send({ embeds: [emb] });
  },
};
