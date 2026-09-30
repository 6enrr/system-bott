const { AttachmentBuilder } = require("discord.js");
const { registerFont } = require("canvas");
const humanizeDuration = require("humanize-duration");
const { inviteTracker } = require("discord-inviter");
const Data = require("pro.db");

let CanvasCtor;
let ccLoadFont = null;
let ccResolveImage = null;
try {
  ({
    Canvas: CanvasCtor,
    loadFont: ccLoadFont,
    resolveImage: ccResolveImage,
  } = require("canvas-constructor/cairo"));
} catch (e) {
  const cc = require("canvas-constructor");
  CanvasCtor = cc.Canvas;
  ccLoadFont = null;
  ccResolveImage = cc.resolveImage;
}

function safeLoadFont(path, family) {
  if (ccLoadFont) {
    try {
      ccLoadFont(path, family);
      return;
    } catch {}
  }
  try {
    registerFont(path, { family });
  } catch (e) {
    console.warn("⚠️ failed to load font:", e.message);
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case "online":
      return "🟢 Online";
    case "idle":
      return "🟡 Idle";
    case "dnd":
      return "🔴 Do Not Disturb";
    case "offline":
      return "⚪ Offline";
    default:
      return "❓ Unknown";
  }
}

module.exports = {
  name: "user",
  aliases: ["يوزر"],
  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const setChannel = Data.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    let targetMember;
    if (message.mentions.members.size > 0) {
      targetMember = message.mentions.members.first();
    } else if (args[0]) {
      const userID = args[0].replace(/[<@!>]/g, "");
      targetMember = message.guild.members.cache.get(userID);
    } else {
      targetMember = message.member;
    }

    if (!targetMember) {
      return message.react("❌");
    }

    try {
      safeLoadFont("./Fonts/Cairo-Regular.ttf", "Cairo");

      const user = targetMember.user;
      const avatarURL = user.displayAvatarURL({
        extension: "png",
        size: 512,
      });

      const bgPath = `${process.cwd()}/Fonts/user.png`;
      let backgroundImage = null;
      try {
        backgroundImage = await ccResolveImage(bgPath);
      } catch {
        backgroundImage = null;
      }

      const canvas = new CanvasCtor(1000, 380);

      if (backgroundImage) {
        canvas.printImage(backgroundImage, 0, 0, 1000, 380);
      } else {
        canvas.setColor("#2f3136").printRectangle(0, 0, 1000, 380);
      }

      const avatarImg = await ccResolveImage(avatarURL);
      canvas
        .setColor("#ffffff")
        .printCircularImage(avatarImg, 180, 170, 140)
        .setTextAlign("center")
        .setTextFont("25px Cairo")
        .setColor("#ffffff")
        .printText(
          targetMember.displayName || user.username,
          180,
          345
        )
        .printText(
          `Status: ${getStatusEmoji(user.presence?.status)}`,
          640,
          130
        );

      const now = new Date();
      const joinedAt = targetMember.joinedAt;
      const createdAt = user.createdAt;

      const joinedDuration = humanizeDuration(now - joinedAt, {
        round: true,
        largest: 2,
      });
      const createdDuration = humanizeDuration(now - createdAt, {
        round: true,
        largest: 2,
      });

      let invite = { count: 0 };
      try {
        invite = await inviteTracker.getMemberInvites(targetMember);
      } catch (e) {
        invite = { count: 0 };
      }

      const userId = targetMember.id;
      const userMessageCount =
        (await Data.fetch(`${userId}_points`)) || 0;
      const userVoicePoints =
        (await Data.fetch(`${userId}_voice`)) || 0;
      const totalPoints = userMessageCount + userVoicePoints;

      canvas
        .setColor("#ffffff")
        .setTextFont("bold 20px Cairo")
        .printText(`${joinedDuration}`, 640, 160)
        .printText(`${createdDuration}`, 640, 230)
        .printText(`${invite.count}`, 640, 300)
        .printText(`${userMessageCount}`, 640, 96)
        .printText(`${userVoicePoints}`, 485, 180)
        .printText(`Total Points: ${totalPoints}`, 640, 360);

      const attachment = new AttachmentBuilder(canvas.toBuffer(), {
        name: "user.png",
      });
      return message.reply({ files: [attachment] });
    } catch (err) {
      console.error(err);
      message.reply("❌ حدث خطأ أثناء توليد الكرت.");
    }
  },
};
