const { EmbedBuilder } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: "semoji",
  run: async (client, message, args) => {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const setChannel = db.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    const Color =
      db.get(`Guild_Color_${message.guild?.id}`) || "#f5f5ff";

    const emojis = args;
    if (!emojis.length) {
      const embed = new EmbedBuilder()
        .setDescription(
          `**استعمل الأمر كذا:**\n\` semoji 😘\``
        )
        .setColor(Color);
      return message.reply({ embeds: [embed] });
    }

    for (const emoji of emojis) {
      const emojiId = emoji.slice(emoji.length - 20, emoji.length - 1);
      if (isNaN(emojiId)) {
        await message.react("❌").catch(() => {});
        continue;
      }

      const emojiURL = emoji.startsWith("<a:")
        ? `https://cdn.discordapp.com/emojis/${emojiId}.gif`
        : `https://cdn.discordapp.com/emojis/${emojiId}.png`;

      await message.reply({ content: emojiURL });
    }
  },
};
