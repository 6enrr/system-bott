const { AttachmentBuilder } = require("discord.js");
const {
  removeBackgroundFromImageUrl,
} = require("remove.bg");
const Data = require("pro.db");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "aremove",
  aliases: ["arbg"],
  description: "إزالة خلفية الصورة",
  run: async (client, message) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    if (message.author.bot || !message.guild) return;

    const user = message.mentions.users.first() || message.author;
    const avatarUrl = user.displayAvatarURL({
      extension: "png",
      size: 4096,
    });

    const outputFile = path.join(__dirname, `${user.id}.png`);

    try {
      await removeBackgroundFromImageUrl({
        url: avatarUrl,
        apiKey: "Z4eebwY5uQrGnMd2pznESTns",
        size: "regular",
        type: "auto",
        outputFile,
      });

      await message.channel.send({
        files: [new AttachmentBuilder(outputFile)],
      });

      fs.unlink(outputFile, () => {});
    } catch (e) {
      console.error(e);
      message.channel.send("حدثت مشكلة أثناء معالجة الصورة.");
    }
  },
};
