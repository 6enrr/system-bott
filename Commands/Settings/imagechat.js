const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: "imagechat",
  description: "To set Url room",
  usage: "!set-Url <Url>",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    let Url = "";
    if (message.content.includes("http")) Url = message.content.split(" ")[1];
    else if (message.attachments.size > 0) Url = message.attachments.first().url;
    else return message.reply({ content: "**يرجى ارفاق رابط الصورة.**" });

    const imagePath = path.join(process.cwd(), "Fonts", "colors.png");
    const res = await fetch(Url);
    const buffer = await res.buffer();
    fs.writeFileSync(imagePath, buffer);

    db.set(`Url = [ Colors ]`, imagePath);
    message.react("✅");
  },
};
