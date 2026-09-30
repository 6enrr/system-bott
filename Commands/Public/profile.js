const {
  AttachmentBuilder,
} = require("discord.js");
const {
  registerFont,
  loadImage,
  createCanvas,
} = require("canvas");
const path = require("path");
const moment = require("moment");
const Data = require("pro.db");
const levelXPMap = require("../../levelXPMap.json");

registerFont(path.resolve("Fonts/Cairo-Regular.ttf"), { family: "Cairo" });

const config = {
  canvasWidth: 400,
  canvasHeight: 400,
  defaultBackgroundImage: path.resolve(`${process.cwd()}/Fonts/image.png`),
  statusColors: {
    online: "#43b581",
    idle: "#faa61a",
    dnd: "#f04747",
    offline: "#747f8d",
  },
  fontFamily: "Cairo",
  avatarSize: 85,
  statusRadius: 12,
  progressBarWidth: 230,
  progressBarHeight: 20,
  progressBarRadius: 10,
};

module.exports = {
  name: "profile",
  aliases: ["p"],
  run: async (client, message) => {
    try {
      const member = message.mentions.members.first() || message.member;

      const [textPoints, voicePoints] = await Promise.all([
        Data.get(`${member.id}_points`) || 0,
        Data.get(`${member.id}_voice`) || 0,
      ]);

      let backgroundImageUrl = Data.get(`${member.id}_background`);
      if (!backgroundImageUrl) {
        backgroundImageUrl = Data.get(`${message.guild.id}_background`);
      }
      if (!backgroundImageUrl) {
        backgroundImageUrl = config.defaultBackgroundImage;
      }

      const totalPoints = textPoints + voicePoints;
      const totalRank = await getTotalRank(member.id);
      const inviteCount = await getInviteCount(message.guild, member.id);
      const accountAge = moment(member.user.createdAt).fromNow(true);
      const totalLevel = calculateLevel(totalPoints);
      const status = member.presence?.status || "offline";

      const canvas = createCanvas(
        config.canvasWidth,
        config.canvasHeight
      );
      const ctx = canvas.getContext("2d");

      try {
        const backgroundImage = await loadImage(backgroundImageUrl);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.error("Error loading background image:", error);
        return message.channel.send(
          "Error loading background image. Please make sure the URL is valid."
        );
      }

      drawLeftPanel(ctx, canvas);
      await drawAvatarAndStatus(ctx, member, status);
      drawUsername(ctx, member);
      drawStats(ctx, totalLevel, accountAge, totalRank, inviteCount);
      drawProgressBar(ctx, textPoints, voicePoints, totalPoints);
      await drawServerInfo(ctx, message.guild);

      const attachment = new AttachmentBuilder(canvas.toBuffer(), {
        name: "profile.png",
      });

      await message.channel.send({ files: [attachment] });
    } catch (error) {
      console.error("Error generating profile card:", error);
      message.channel.send(
        "❌ An error occurred while generating the profile card."
      );
    }
  },
};

async function getTotalRank(userId) {
  const allEntries = await Data.fetchAll();
  const totalPointsEntries = Object.entries(allEntries)
    .filter(([key]) => key.endsWith("_points") || key.endsWith("_voice"))
    .reduce((acc, [key, value]) => {
      const baseId = key.split("_")[0];
      acc[baseId] = (acc[baseId] || 0) + value;
      return acc;
    }, {});

  const sortedEntries = Object.entries(totalPointsEntries).sort(
    ([, valueA], [, valueB]) => valueB - valueA
  );

  const userRank =
    sortedEntries.findIndex(([key]) => key === userId) + 1;

  return userRank || null;
}

function calculateLevel(points) {
  let level = 0;
  while (levelXPMap[level + 1] && points >= levelXPMap[level + 1]) {
    level++;
  }
  return level;
}

async function getInviteCount(guild, userId) {
  const invites = await guild.invites.fetch();
  const userInvites = invites.filter(
    (inv) => inv.inviter && inv.inviter.id === userId
  );
  return userInvites.reduce((acc, inv) => acc + inv.uses, 0);
}

function drawLeftPanel(ctx, canvas) {
  ctx.fillStyle = "rgba(32, 34, 37, 0.9)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(150, 0);
  ctx.lineTo(150, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();
}

async function drawAvatarAndStatus(ctx, member, status) {
  const avatar = await loadImage(
    member.user.displayAvatarURL({ extension: "png", size: 1024 })
  );
  const offsetY = -13;
  const imageSize = config.avatarSize;
  const imageOffsetX = 75 - imageSize / 2;
  const imageOffsetY = 75 + offsetY - imageSize / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(75, 75 + offsetY, 42.5, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, imageOffsetX, imageOffsetY, imageSize, imageSize);
  ctx.restore();

  const statusX = 75 + 30;
  const statusY = 75 + offsetY + 30;

  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(statusX, statusY, config.statusRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#2f3136";
  ctx.fill();

  ctx.shadowBlur = 2;
  ctx.beginPath();
  ctx.arc(statusX, statusY, config.statusRadius - 2, 0, Math.PI * 2);
  ctx.fillStyle = config.statusColors[status];
  ctx.fill();
}

function drawUsername(ctx, member) {
  const displayName = member.user.displayName;
  const truncatedName =
    displayName.length > 14
      ? displayName.slice(0, 12) + "..."
      : displayName;

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 20px ${config.fontFamily}`;
  ctx.textAlign = "center";
  ctx.fillText(truncatedName, 75, 75 + -13 + 42.5 + 25);
}

function drawStats(ctx, totalLevel, accountAge, totalRank, inviteCount) {
  const statsConfig = [
    { label: "LVL", value: totalLevel.toString(), y: 160, valueY: 190 },
    { label: "ACCOUNT AGE", value: accountAge, y: 220, valueY: 250 },
    { label: "RANK", value: `#${totalRank || "Not ranked"}`, y: 280, valueY: 310 },
    { label: "INVITES", value: inviteCount.toString(), y: 340, valueY: 370 },
  ];

  ctx.font = `bold 14px ${config.fontFamily}`;
  ctx.textAlign = "left";

  statsConfig.forEach((stat) => {
    ctx.fillStyle = "white";
    ctx.fillText(stat.label, 20, stat.y);
    ctx.fillText(stat.value, 20, stat.valueY);
  });
}

function drawProgressBar(ctx, textPoints, voicePoints, totalPoints) {
  const progressBarX = 155;
  const progressBarY = 360;

  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  roundRect(
    ctx,
    progressBarX,
    progressBarY,
    config.progressBarWidth,
    config.progressBarHeight,
    config.progressBarRadius,
    true
  );

  const totalWidth = config.progressBarWidth;
  const voiceWidth = (totalWidth * voicePoints) / (totalPoints || 1);
  const textWidth = (totalWidth * textPoints) / (totalPoints || 1);

  const combinedGradient = ctx.createLinearGradient(
    progressBarX,
    progressBarY,
    progressBarX + totalWidth,
    progressBarY
  );
  combinedGradient.addColorStop(0, "#5865f2");
  combinedGradient.addColorStop(voiceWidth / totalWidth, "#5865f2");
  combinedGradient.addColorStop(voiceWidth / totalWidth, "#ff9d00");
  combinedGradient.addColorStop(1, "#ffc107");

  ctx.fillStyle = combinedGradient;
  roundRect(
    ctx,
    progressBarX,
    progressBarY,
    totalWidth,
    config.progressBarHeight,
    config.progressBarRadius,
    true
  );

  ctx.font = `bold 17.5px ${config.fontFamily}`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.fillText(`TOTAL XP: ${totalPoints}`, 320, 340);
}

async function drawServerInfo(ctx, guild) {
  const serverName = guild.name;
  const serverAvatarURL = guild.iconURL({ extension: "png", size: 1024 });

  if (serverAvatarURL) {
    const serverAvatar = await loadImage(serverAvatarURL);
    const avatarSize = 40;
    const avatarX = config.canvasWidth - avatarSize - 10;
    const avatarY = 10;

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(serverAvatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = "white";
    ctx.stroke();

    const textX = avatarX - 10;
    const textY = avatarY + avatarSize / 2 + 6;
    ctx.font = `bold 18px ${config.fontFamily}`;
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText(serverName, textX, textY);
  }
}

function roundRect(ctx, x, y, width, height, radius, fill) {
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
  if (fill) ctx.fill();
}
