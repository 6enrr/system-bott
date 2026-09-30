const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { owners } = require(`${process.cwd()}/config`);
const Data = require("pro.db");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "edit-wlc",
  description: "Edit user details",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    registerFont(`./Fonts/Cairo-Regular.ttf`, { family: "Cairo" });

    const initialMenu = new StringSelectMenuBuilder()
      .setCustomId("edit_select")
      .setPlaceholder("اختر ما تريد تحريره")
      .addOptions(
        { label: "إحديثات الاسم", value: "username", emoji: "⚒️" },
        { label: "إحديثات الافتار", value: "avatar", emoji: "⚒️" },
        { label: "صورة الولكم", value: "image", emoji: "⚒️" },
        { label: "شات الولكم", value: "channel", emoji: "⚒️" },
        { label: "رسالة الولكم", value: "messg", emoji: "⚒️" },
      );

    const cancelBtn = new ButtonBuilder()
      .setCustomId("Cancele")
      .setLabel("إلغاء")
      .setStyle(ButtonStyle.Danger);

    const menuRow = new ActionRowBuilder().addComponents(initialMenu);
    const cancelRow = new ActionRowBuilder().addComponents(cancelBtn);

    const menuMsg = await message.reply({
      embeds: [
        {
          title: "**يرجى تحديد نوع التعديل**",
          footer: {
            text: client.user.username,
            icon_url: client.user.displayAvatarURL(),
          },
        },
      ],
      components: [menuRow, cancelRow],
    });

    const baseFilter = (i) =>
      i.user.id === message.author.id &&
      (i.customId === "Cancele" || i.customId === "edit_select");
    const baseCollector = menuMsg.createMessageComponentCollector({
      filter: baseFilter,
      time: 60_000,
    });

    baseCollector.on("collect", async (i) => {
      if (i.customId === "Cancele") {
        baseCollector.stop("cancel");
        return i.update({ components: [] });
      }

      if (!i.isStringSelectMenu()) return;
      const selected = i.values[0];

      await i.update({ components: [] });

      if (selected === "username") {
        if (message.author.bot) return;
        const bgPath = Data.get(`imgwlc_${message.guild.id}`) || null;
        const canvas = createCanvas(826, 427);
        const ctx = canvas.getContext("2d");

        let backgroundImage = null;
        if (bgPath) {
          try {
            backgroundImage = await loadImage(bgPath);
            canvas.width = backgroundImage.width;
            canvas.height = backgroundImage.height;
          } catch {}
        }

        const avatarURL = message.author.displayAvatarURL({
          extension: "png",
          size: 1024,
          forceStatic: false,
        });
        const avatar = await loadImage(avatarURL);
        const avatarUpdates =
          Data.get(`editwel_${message.guild.id}`) ||
          ({ size: 260, x: 233, y: 83.5, isCircular: true });
        const { size, x: avatarX, y: avatarY, isCircular } = avatarUpdates;

        let x = canvas.width / 2;
        let y = canvas.height / 2;
        let fontSize = 40;
        const username = message.member?.displayName || message.author.username;

        const drawAll = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (backgroundImage) ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
          else {
            ctx.fillStyle = "rgba(0,0,0,0)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.save();
          if (isCircular) {
            ctx.beginPath();
            ctx.arc(avatarX + size / 2, avatarY + size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
          }
          ctx.drawImage(avatar, avatarX, avatarY, size, size);
          ctx.restore();

          ctx.font = `${fontSize}px Cairo`;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(username, x, y);
        };

        drawAll();

        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("up").setEmoji("⬆️").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("down").setEmoji("⬇️").setStyle(ButtonStyle.Primary),
        );
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("left").setEmoji("⬅️").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("right").setEmoji("➡️").setStyle(ButtonStyle.Primary),
        );
        const row3 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("decrease").setEmoji("➖").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId("increase").setEmoji("➕").setStyle(ButtonStyle.Success),
        );
        const row4 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("save").setEmoji("✅").setStyle(ButtonStyle.Success),
        );

        const buffer = canvas.toBuffer("image/png");
        const file = new AttachmentBuilder(buffer, { name: "welcome-preview.png" });

        const previewMsg = await message.channel.send({
          content: "**تعديل إعدادات الترحيب ⚙️**",
          files: [file],
          components: [row1, row2, row3, row4],
        });

        const speed = 100;
        const subFilter = (ii) => ii.message.id === previewMsg.id && ii.user.id === message.author.id;
        const subCollector = previewMsg.createMessageComponentCollector({ filter: subFilter, time: 2_000_000 });

        subCollector.on("collect", async (ii) => {
          if (ii.customId === "up") y -= speed;
          else if (ii.customId === "down") y += speed;
          else if (ii.customId === "left") x -= speed;
          else if (ii.customId === "right") x += speed;
          else if (ii.customId === "increase") fontSize += 50;
          else if (ii.customId === "decrease") fontSize = Math.max(10, fontSize - 50);
          else if (ii.customId === "save") {
            Data.set(`editname_${message.guild.id}`, { size: fontSize, x, y, isCircular });
            return ii.update({ components: [], content: "**تم حفظ الاحديثات بنجاح. ✅**" });
          }

          drawAll();
          const buf = canvas.toBuffer("image/png");
          await ii.update({
            files: [new AttachmentBuilder(buf, { name: "welcome-preview.png" })],
            components: [row1, row2, row3, row4],
            content: "**تعديل إعدادات الترحيب ⚙️**",
          });
        });

        subCollector.on("end", async () => {
          try {
            await previewMsg.edit({ components: [] });
          } catch {}
        });
      }

      if (selected === "avatar") {
        if (message.author.bot) return;

        const canvas = createCanvas(826, 427);
        const ctx = canvas.getContext("2d");

        const backgroundImageURL = Data.get(`imgwlc_${message.guild.id}`);
        let backgroundImage = null;
        if (backgroundImageURL) {
          try {
            backgroundImage = await loadImage(backgroundImageURL);
            canvas.width = backgroundImage.width;
            canvas.height = backgroundImage.height;
          } catch {}
        }

        const user = message.author;
        const avatar = await loadImage(user.displayAvatarURL({ extension: "png", forceStatic: false, size: 1024 }));
        let avatarSize = 400;
        let avatarX = (canvas.width - avatarSize) / 2;
        let avatarY = (canvas.height - avatarSize) / 2;
        let isCircular = false;

        const drawAll = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (backgroundImage) ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
          else {
            ctx.fillStyle = "rgba(0,0,0,0)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.save();
          if (isCircular) {
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
          }
          ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();
        };

        drawAll();

        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("zoomIn").setEmoji("➕").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("up").setEmoji("⬆️").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("zoomOut").setEmoji("➖").setStyle(ButtonStyle.Secondary),
        );
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("left").setEmoji("⬅️").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("save").setEmoji("✅").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("right").setEmoji("➡️").setStyle(ButtonStyle.Primary),
        );
        const row3 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("toggleShape").setEmoji("#️⃣").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("down").setEmoji("⬇️").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("delete").setEmoji("❌").setStyle(ButtonStyle.Danger),
        );

        const file = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "welcome-preview.png" });
        const preview = await message.channel.send({
          content: "**تعديل إعدادات الترحيب ⚙️**",
          files: [file],
          components: [row1, row2, row3],
        });

        const speed = 10;
        const zoomSpeed = 15;
        const filt = (ii) => ii.message.id === preview.id && ii.user.id === message.author.id;
        const coll = preview.createMessageComponentCollector({ filter: filt, time: 2_000_000 });

        coll.on("collect", async (ii) => {
          if (ii.customId === "up") avatarY -= speed;
          else if (ii.customId === "down") avatarY += speed;
          else if (ii.customId === "left") avatarX -= speed;
          else if (ii.customId === "right") avatarX += speed;
          else if (ii.customId === "zoomIn") avatarSize += zoomSpeed;
          else if (ii.customId === "zoomOut") avatarSize = Math.max(20, avatarSize - zoomSpeed);
          else if (ii.customId === "toggleShape") isCircular = !isCircular;
          else if (ii.customId === "delete") {
            for (const k of [
              `mesg_message_${message.guild.id}`,
              `imgwlc_${message.guild.id}`,
              `chat_wlc_${message.guild.id}`,
              `editwel_${message.guild.id}`,
            ]) Data.has(k) && Data.delete(k);
          } else if (ii.customId === "save") {
            Data.set(`editwel_${message.guild.id}`, {
              x: avatarX,
              y: avatarY,
              size: avatarSize,
              isCircular,
            });
            return ii.update({ components: [], content: "**تم حفظ الاحديثات بنجاح. ✅**" });
          }

          drawAll();
          const img = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "welcome-preview.png" });
          await ii.update({ files: [img], components: [row1, row2, row3], content: "**تعديل إعدادات الترحيب ⚙️**" });
        });

        coll.on("end", async () => {
          try {
            await preview.edit({ components: [] });
          } catch {}
        });
      }

      if (selected === "image") {
        if (message.author.bot) return;

        let imageURL = args[0] || (message.attachments.first()?.url ?? null);
        if (!imageURL) {
          const ask = await message.reply("**يرجى أرفاق رابط الصورة او الصورة.** ⚙️");
          const f = (m) => m.author.id === message.author.id;
          const col = message.channel.createMessageCollector({ filter: f, time: 60_000 });

          col.on("collect", async (msg) => {
            const url = msg.attachments.first()?.url || msg.content?.trim();
            if (!url) return msg.reply("**يرجى أرفاق رابط الصورة او الصورة.** ⚙️");
            imageURL = url;
            await saveImage(message.guild.id, imageURL);
            await message.react("✅");
            await ask.edit("**تم حفظ الصورة بنجاح. ✅**");
            try { await msg.delete(); } catch {}
            col.stop();
          });

          col.on("end", () => {
            if (!imageURL) ask.edit("**أنتهى وقت التعديل** ❌").catch(() => {});
          });
        } else {
          await saveImage(message.guild.id, imageURL);
          await message.react("✅");
        }

        async function saveImage(guildId, imageUrl) {
          const imageName = "welcome.png";
          const imagePath = path.join(process.cwd(), "Fonts", imageName);
          const response = await fetch(imageUrl);
          const buffer = await response.buffer();
          fs.writeFileSync(imagePath, buffer);
          Data.set(`imgwlc_${guildId}`, imagePath);
        }
      }

      if (selected === "channel") {
        if (args[0]) {
          const channelID = args[0].replace(/\D/g, "");
          if (message.guild.channels.cache.has(channelID)) {
            Data.set(`chat_wlc_${message.guild.id}`, channelID);
            return message.reply("**تم حفظ القناة بنجاح.** ✅");
          }
        }

        const chMention = message.mentions.channels.first();
        if (chMention) {
          Data.set(`chat_wlc_${message.guild.id}`, chMention.id);
          return message.reply("**تم حفظ القناة بنجاح.** ✅");
        }

        const req = await message.reply("**يرجى ارفاق منشن الشات او الايدي .** ⚙️");
        const f = (m) => m.author.id === message.author.id;
        const c = message.channel.createMessageCollector({ filter: f, time: 30_000 });

        c.on("collect", async (msg) => {
          const channel = msg.mentions.channels.first();
          if (channel) {
            Data.set(`chat_wlc_${message.guild.id}`, channel.id);
            c.stop();
          } else {
            const channelID = msg.content.replace(/\D/g, "");
            if (message.guild.channels.cache.has(channelID)) {
              Data.set(`chat_wlc_${message.guild.id}`, channelID);
              c.stop();
            } else {
              msg.reply("**يرجى ارفاق منشن الشات او الايدي .**⚙️");
            }
          }
        });

        c.on("end", () => {
          const id = Data.get(`chat_wlc_${message.guild.id}`);
          if (!id) req.edit("**أنتهى وقت التعديل** ❌");
          else req.edit("**تم حفظ القناة بنجاح.** ✅");
        });
      }

      if (selected === "messg") {
        let selectedContent = args.length ? args.join(" ") : null;
        if (!selectedContent) {
          const help =
            "**يرجى إرفاق رسالة الترحيب** ⚙️\n" +
            "```[user] : يذكر إسم العضو\n[inviter] : يذكر إسم الداعي\n[servername] : يذكر إسم السيرفر\n[membercount] : يذكر عدد أعضاء السيرفر```";
          const req = await message.reply(help);
          const f = (m) => m.author.id === message.author.id;
          const c = message.channel.createMessageCollector({ filter: f, time: 30_000 });

          c.on("collect", (msg) => {
            selectedContent = msg.content;
            c.stop();
          });

          c.on("end", () => {
            if (!selectedContent) req.edit("**أنتهى وقت التعديل** ❌");
            else {
              Data.set(`mesg_message_${message.guild.id}`, selectedContent);
              req.edit("**تم حفظ النص بنجاح.** ✅");
            }
          });
        } else {
          Data.set(`mesg_message_${message.guild.id}`, selectedContent);
          message.reply("**تم حفظ النص بنجاح.** ✅");
        }
      }
    });

    baseCollector.on("end", async () => {
      try { await menuMsg.edit({ components: [] }); } catch {}
    });
  },
};
