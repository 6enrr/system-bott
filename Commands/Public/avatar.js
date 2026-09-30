const {
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fetch = require("node-fetch");
const Data = require("pro.db");

let CanvasCtor;
let ccResolveImage = null;
try {
  ({ Canvas: CanvasCtor, resolveImage: ccResolveImage } = require(
    "canvas-constructor/cairo"
  ));
} catch (e) {
  const cc = require("canvas-constructor");
  CanvasCtor = cc.Canvas;
  ccResolveImage = cc.resolveImage;
}

const fs = require("fs");
function fsExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

module.exports = {
  name: "avatar",
  aliases: ["a"],
  cooldown: 5,

  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const setChannel = Data.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    let user;
    let userId;

    if (message.mentions.users.size > 0) {
      user = message.mentions.users.first();
      userId = user.id;
    } else if (args[0]) {
      userId = args[0].replace(/[<@!>]/g, "");
    } else {
      user = message.author;
      userId = user.id;
    }

    try {
      const response = await fetch(
        `https://discord.com/api/v9/users/${userId}`,
        {
          headers: {
            Authorization: `Bot ${client.token}`,
          },
        }
      );

      if (!response.ok) {
        return message.reply("**خطأ: غير قادر على جلب بيانات المستخدم.**");
      }

      const userData = await response.json();

      const avatarURL = userData.avatar
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${
            userData.discriminator % 5
          }.png`;

      const fetchedUserData = await client.users.fetch(userId);
      const avatarbotn = fetchedUserData.displayAvatarURL({
        dynamic: true,
        extension: "png",
        size: 512,
      });

      let bannerAvailable = false;
      let bannerURL = null;
      if (userData.banner) {
        bannerURL = `https://cdn.discordapp.com/banners/${userData.id}/${userData.banner}.png?size=1024`;
        bannerAvailable = true;
      }

      const canvas = new CanvasCtor(350, 220)
        .setColor("#000000")
        .printRectangle(0, 0, 350, 220);

      const badgesPath = `${process.cwd()}/Fonts/Badges.png`;
      if (fsExists(badgesPath)) {
        const backgroundImage = await ccResolveImage(badgesPath);
        canvas.printImage(backgroundImage, 0, 0, 350, 220);
      }

      if (bannerAvailable && bannerURL) {
        try {
          const bannerImage = await ccResolveImage(bannerURL);
          canvas.printImage(bannerImage, 0, 0, 350, 110);
        } catch (e) {
          canvas.setColor("#2e3035").printRectangle(0, 0, 350, 110);
        }
      } else {
        canvas.setColor("#2e3035").printRectangle(0, 0, 350, 110);
      }

      const avatarImage = await ccResolveImage(avatarURL);
      canvas.setColor("#000000").printCircle(70, 110, 53);
      canvas.printCircularImage(avatarImage, 70, 110, 45);
      canvas.setColor("#000000").printCircle(100, 142, 14);
      canvas.setColor("#00f000").printCircle(100, 142, 10);

  
      const guildMember = message.guild.members.cache.get(userId);
      const displayName =
        (guildMember && guildMember.nickname) || userData.username;

      canvas
        .setColor("#ffffff")
        .setTextSize(19)
        .setTextAlign("left")
        .printText(`@${displayName}`, 15, 178);

      const attachment = new AttachmentBuilder(canvas.toBuffer(), {
        name: "avatar.png",
      });

      const bannerButton = new ButtonBuilder()
        .setLabel("Banner")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("show_banner")
        .setDisabled(!bannerAvailable);

      const avatarButton = new ButtonBuilder()
        .setLabel("Avatar")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("show_avatar")
        .setDisabled(!avatarbotn);

      const profileLinkButton = new ButtonBuilder()
        .setLabel("Profile Link")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/users/${userId}`);

      const actionRow = new ActionRowBuilder().addComponents(
        bannerButton,
        avatarButton,
        profileLinkButton
      );

      const replyMessage = await message.reply({
        files: [attachment],
        components: [actionRow],
      });

      const filter = (interaction) => interaction.user.id === message.author.id;
      const collector = replyMessage.createMessageComponentCollector({
        filter,
        time: 15000,
      });

      collector.on("collect", async (interaction) => {
        if (!interaction.isButton()) return;
        const buttonId = interaction.customId;

        if (buttonId === "show_banner") {
          if (bannerAvailable) {
            await interaction.reply({ files: [bannerURL], ephemeral: true });
          } else {
            await interaction.reply({
              content: "**لا يملك بنر.** ❌",
              ephemeral: true,
            });
          }
        } else if (buttonId === "show_avatar") {
          if (avatarbotn) {
            await interaction.reply({ files: [avatarbotn], ephemeral: true });
          } else {
            await interaction.reply({
              content: "**لا يملك آفاتار.** ❌",
              ephemeral: true,
            });
          }
        }
      });

      collector.on("end", () => {
        replyMessage
          .edit({ components: [] })
          .catch(() => {});
      });
    } catch (err) {
      console.error("avatar command error:", err);
      message.reply("**حدث خطأ أثناء تنفيذ الأمر.**");
    }
  },
};
