const db = require("pro.db");
const { prefix, owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder, ChannelType } = require("discord.js");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

module.exports = {
  name: "autoline",
  description: "Set image URL and channel",
  usage: `autoline <imageURL> <#channel>`,
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = db.get(`command_enabled_autoline`);
    if (isEnabled === false) return;

    const Color = db.get(`Guild_Color_${message.guild.id}`) || "#f5f5ff";

    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription("❌ استخدم الأمر هكذا:\n`autoline <imageURL> <#channel>`");
      return message.reply({ embeds: [embed] });
    }

    if (args.length % 2 !== 0) {
      return message.reply("❌ لازم تكتب رابط الصورة وبعده منشن الشات.");
    }

    const storedChannels = db.get("Channels") || [];

    for (let i = 0; i < args.length; i += 2) {

      const imageURL = args[i];
      const channelMention = args[i + 1];

      const channelID = channelMention.replace(/[^0-9]/g, "");
      const channel = message.guild.channels.cache.get(channelID);

      if (!channel || channel.type !== ChannelType.GuildText)
        return message.reply("❌ الشات غير صحيح.");

      const idx = storedChannels.findIndex(c => c.channelID === channelID);

      if (idx !== -1)
        storedChannels[idx].imageURL = imageURL;
      else
        storedChannels.push({ channelID, imageURL });

    }

    for (const channel of storedChannels) {

      const imageURL = channel.imageURL;
      const fileName = `Line_${channel.channelID}.png`;
      const filePath = path.join(process.cwd(), "Fonts", fileName);

      try {

        const res = await fetch(imageURL);
        const buffer = await res.buffer();

        fs.writeFileSync(filePath, buffer);

        channel.imageURL = filePath;

      } catch (err) {

        console.log("Image download error:", err);

      }

    }

    db.set(
      "Channels",
      storedChannels.map(c => ({
        channelID: c.channelID,
        fontURL: c.imageURL
      }))
    );

    message.react("✅");

  }
};