const { AttachmentBuilder } = require("discord.js");
const db = require("pro.db");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  name: "colors",
  aliases: ["الوان"],
  description: "Shows server colors",
  run: async (client, message) => {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const setChannel = db.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    const colorRoles = message.guild.roles.cache.filter(
      (role) => !isNaN(role.name) && !role.name.includes(".")
    );

    if (colorRoles.size === 0) {
      return message.reply("**لا يوجد الوان في السيرفر.**");
    }

    const sortedRoles = colorRoles.sort(
      (a, b) => b.position - a.position
    );

    const canvasHeight = 400;
    const canvas = createCanvas(1200, canvasHeight);
    const ctx = canvas.getContext("2d");

    const url = db.get("Url = [ Colors ]");
    if (url) {
      try {
        const bg = await loadImage(url);
        ctx.drawImage(bg, 0, 0, 1200, 500);
      } catch (e) {}
    }

    let x = 50;
    let y = 145;

    sortedRoles.forEach((colorRole) => {
      x += 90;
      if (x > 1080) {
        x = 110;
        y += 90;
      }

      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      ctx.fillStyle = colorRole.hexColor;
      ctx.lineWidth = 5;
      ctx.strokeStyle = "black";

      const radius = 40;
      ctx.beginPath();
      ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      const colorNumber = colorRole.name;
      ctx.font = "26px Arial";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "black";
      ctx.strokeText(colorNumber, x + radius, y + radius);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(colorNumber, x + radius, y + radius);
    });

    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "img.png",
    });

    await message.channel.send({ files: [attachment] });
  },
};
