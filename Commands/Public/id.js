const {
  AttachmentBuilder,
} = require("discord.js");
const {
  registerFont,
  loadImage,
  createCanvas,
} = require("canvas");
const path = require("path");
registerFont(path.resolve("Fonts/arial.ttf"), { family: "Arial" });
const tinycolor = require("tinycolor2");
const Data = require("pro.db");
const levelXPMap = require("../../levelXPMap.json");

module.exports = {
  name: "id",
  aliases: ["ايدي"],
  run: async (client, message) => {
    const args = message.content.split(" ");

    try {
      let cha = await Data.get(`channel_${message.guild.id}`);
      if (cha && !cha.includes(message.channel.toString()))
        return message.reply(`الامر ليس هنا انه هنا ${cha}`);

      const member =
        message.mentions.members.first() ||
        message.guild.members.cache.get(args[1]) ||
        message.member;

      const textPoints =
        (await Data.get(`${member.id}_points`)) || 0;
      const voicePoints =
        (await Data.get(`${member.id}_voice`)) || 0;

      const textLevel = calculateLevel(textPoints);
      const voiceLevel = calculateLevel(voicePoints);

      const canvas = createCanvas(1000, 380);
      const ctx = canvas.getContext("2d");

      let color = "#fff";

      const img = await loadImage("Fonts/background.png");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const avatar = await loadImage(
        member.user.displayAvatarURL({ extension: "png" })
      );

      const avatarX = 60;
      const avatarY = 50;
      const avatarWidth = 220;
      const avatarHeight = 220;

      ctx.save();
      roundedImage(ctx, avatarX, avatarY, 185, 185, 35);
      ctx.drawImage(avatar, avatarX, avatarY, avatarWidth, avatarHeight);
      ctx.restore();

      const username =
        member.user.displayName.length > 8
          ? member.user.displayName.slice(0, 8).concat("...")
          : member.user.displayName;
      ctx.font = "35px Arial";
      ctx.fillStyle = tinycolor(color).setAlpha(0.7).toString();
      ctx.fillText(username, 100, 330);

      ctx.font = "800 30px Arial";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(textLevel, 360, 230);
      ctx.font = "800 20px Arial";
      ctx.fillText("LVL", 360, 200);

      ctx.font = "800 20px Arial";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(textPoints, 890, 170);
      ctx.fillText("Total: ", 845, 170);

      const nextTextLevelXP = levelXPMap[textLevel + 1] || levelXPMap[1];
      const currentTextLevelXP = levelXPMap[textLevel] || 0;
      const textProgress =
        (textPoints - currentTextLevelXP) /
        (nextTextLevelXP - currentTextLevelXP);

      roundRect(
        ctx,
        476,
        185,
        textProgress * 425,
        53,
        25,
        "#686971",
        textProgress
      );

      ctx.font = "25px Arial";
      ctx.fillStyle = "#A2BED6";
      ctx.textAlign = "center";
      ctx.fillText(
        `${textPoints - currentTextLevelXP}/${
          nextTextLevelXP - currentTextLevelXP
        }`,
        700,
        220
      );

      ctx.font = "800 30px Arial";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(voiceLevel, 360, 330);

      ctx.font = "800 20px Arial";
      ctx.fillText("LVL", 360, 300);

      ctx.font = "800 20px Arial";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(voicePoints, 890, 270);
      ctx.fillText("Total: ", 845, 270);

      const nextVoiceLevelXP =
        levelXPMap[voiceLevel + 1] || levelXPMap[1];
      const currentVoiceLevelXP = levelXPMap[voiceLevel] || 0;
      const voiceProgress =
        (voicePoints - currentVoiceLevelXP) /
        (nextVoiceLevelXP - currentVoiceLevelXP);

      roundRect(
        ctx,
        480,
        285,
        voiceProgress * 425,
        53,
        25,
        "#686971",
        voiceProgress
      );

      ctx.font = "25px Arial";
      ctx.fillStyle = "#A2BED6";
      ctx.textAlign = "center";
      ctx.fillText(
        `${voicePoints - currentVoiceLevelXP}/${
          nextVoiceLevelXP - currentVoiceLevelXP
        }`,
        700,
        320
      );

      await message.channel.send({
        files: [
          new AttachmentBuilder(canvas.toBuffer(), {
            name: "rank.png",
          }),
        ],
      });
    } catch (error) {
      console.error(error);
      message.channel.send("❌");
    }
  },
};

function calculateLevel(points) {
  let level = 0;
  while (levelXPMap[level + 1] && points >= levelXPMap[level + 1]) {
    level++;
  }
  return level;
}

function roundedImage(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.clip();
}

function roundRect(ctx, x, y, width, height, radius, color, progress) {
  if (progress === 0 || width === 0) return;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
