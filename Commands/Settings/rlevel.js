const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
} = require("discord.js");
const Data = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "total",
  aliases: ["rlevel"],
  run: async (client, message) => {
    const Color =
      Data.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      Colors.Blurple;

    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const allUsers = await Data.fetchAll();
    const userTextEntries = Object.entries(allUsers).filter(([k]) => k.endsWith("_points"));
    const userVoiceEntries = Object.entries(allUsers).filter(([k]) => k.endsWith("_voice"));

    const combined = userTextEntries.map(([key, value]) => {
      const userId = key.split("_")[0];
      const voicePoints = userVoiceEntries.find(([k]) => k.startsWith(userId))?.[1] || 0;
      return [userId, value + voicePoints];
    });

    combined.sort((a, b) => b[1] - a[1]);

    const rows = combined.map(([id, pts], i) => `**#${i + 1}.** <@${id}>: ${pts} XP`);
    if (rows.length === 0) return message.react("🍇");

    const totalPages = Math.ceil(rows.length / 15);
    let page = 1;

    const pageEmbed = () =>
      new EmbedBuilder()
        .setDescription(rows.slice((page - 1) * 15, page * 15).join("\n"))
        .setColor(Color);

    const controls = () =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("previous").setEmoji("⬅️").setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
        new ButtonBuilder().setCustomId("next").setEmoji("➡️").setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages)
      );

    const msg = await message.reply({ embeds: [pageEmbed()], components: [controls()] });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "previous") page = Math.max(1, page - 1);
      if (i.customId === "next") page = Math.min(totalPages, page + 1);
      await i.update({ embeds: [pageEmbed()], components: [controls()] });
    });

    collector.on("end", async () => {
      await msg.edit({ components: [] }).catch(() => {});
    });
  },
};
