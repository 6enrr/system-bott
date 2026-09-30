const Pro = require("pro.db");
const fetch = require("node-fetch");
const { owners } = require(`${process.cwd()}/config`);
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "setrimage",
  description: "Set an image for evaluation",
  usage: "!setimage <imageURL> or attach an image",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    let imageURL;
    let imageName = "ret-us.png"; 

    if (args[0]) imageURL = args[0];
    else if (message.attachments.size > 0) imageURL = message.attachments.first().url;
    else return message.reply("**يرجى ارفاق رابط الصورة أو الصورة **");

    if (!args[0] && message.attachments.size === 0)
      return message.reply("**يرجى ارفاق رابط الصورة أو الصورة **");

    const response = await fetch(imageURL);
    const buffer = await response.buffer();

    const imagePath = path.join(process.cwd(), "Fonts", imageName);
    fs.writeFileSync(imagePath, buffer);

    Pro.set(`setImageURL_${message.guild.id}`, imagePath);
    message.react("✅");
  },
};
