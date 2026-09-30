const db = require("pro.db");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "ticimage",
  description: "حفظ صورة التذكرة",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;
    if (message.author.bot || !message.guild) return;

    const attachment = message.attachments.first();
    const url = attachment?.url || message.content.split(/\s+/).slice(1).join(" ");
    if (!url) return message.reply({ content: "**يرجى ارفاق رابط الصورة.**" });

    await message.react("✅");
    const imagePath = path.join(process.cwd(), "Fonts", "Ticket.png");
    const res = await fetch(url);
    const buf = await res.buffer();
    fs.writeFileSync(imagePath, buf);
    db.set(`Image = [${message.guild.id}]`, imagePath);
  },
};
