const { AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");
const deepai = require("deepai");
const isImageUrl = require("is-image-url");
const cloudinary = require("cloudinary").v2;
const Data = require("pro.db");

module.exports = {
  name: "change",
  aliases: ["ch"],
  description: "تحويل أو تعديل الصورة",
  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const setChannel = Data.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    deepai.setApiKey("37daf812-c7fd-460c-903c-ad362b9d6b76");
    cloudinary.config({
      cloud_name: "ertghy",
      api_key: "256788467711845",
      api_secret: "2IGlZ3XdRuSJ0SD53NQZntKGMNk",
    });

    let image =
      message.attachments.first()?.url ||
      (args[0] && isImageUrl(args[0]) ? args[0] : null) ||
      message.author.displayAvatarURL({ extension: "png", size: 1024 });

    if (message.mentions.users.first()) {
      image = message.mentions.users
        .first()
        .displayAvatarURL({ extension: "png", size: 1024 });
    }

    cloudinary.uploader.upload(
      image,
      {
        public_id: message.author.id,
        transformation: [{ effect: "grayscale" }],
      },
      (err, res) => {
        if (err) {
          console.error(err);
          return message.reply("Error ..");
        }

        return message.reply({
          files: [
            {
              attachment: res.url,
            },
          ],
        });
      }
    );
  },
};
