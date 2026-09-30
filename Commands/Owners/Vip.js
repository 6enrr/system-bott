const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ActivityType,
} = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const Data = require("pro.db");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const fetch = require("node-fetch");

module.exports = {
  name: "vip",
  description: "VIP commands",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("vipMenu")
        .setPlaceholder("اختر إحدى الخيارات")
        .addOptions(
          { label: "تغير الاسم", emoji: "✏️", description: "لتغير إسم البوت", value: "setname" },
          { label: "تغيير صورة", emoji: "🌠", description: "لتغير صورة البوت", value: "setavatar" },
          { label: "تغير الحالة", emoji: "🚥", description: "لتغير حالة البوت", value: "setstatus" },
          { label: "تغير اللون", emoji: "🎨", description: "لتغير لون البوت", value: "setcolor" },
          { label: "تغيير البانر", emoji: "🏞️", description: "لتغير بانر البوت", value: "setbanner" },
          { label: "إعادة تشغيل البوت", emoji: "🔄", description: "لإعادة تشغيل البوت", value: "restart" },
        )
    );

    const cancelRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("CancelVipMenu").setLabel("إلغاء").setStyle(ButtonStyle.Danger)
    );

    const menuMessage = await message.reply({
      content: "**قائمة تعديل البوت ⚙️**",
      components: [selectMenu, cancelRow],
    });

    const filter = (interaction) =>
      interaction.user.id === message.author.id &&
      interaction.message.id === menuMessage.id;

    const collector = menuMessage.createMessageComponentCollector({
      filter,
      time: 60_000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.isButton() && interaction.customId === "CancelVipMenu") {
        await interaction.update({ content: "**تم إلغاء العملية. ✅**", components: [] });
        collector.stop("cancel");
        return;
      }

      if (!interaction.isStringSelectMenu() || interaction.customId !== "vipMenu") return;

      const choice = interaction.values?.[0];
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate().catch(() => {});
      }

      switch (choice) {
        case "setavatar":
          await handleSetAvatar(interaction, message, client);
          break;
        case "setname":
          await handleSetName(interaction, message, client);
          break;
        case "setstatus":
          await handleSetStatus(interaction, message, client);
          break;
        case "setcolor":
          await handleSetColor(interaction, message);
          break;
        case "setbanner":
          await handleSetBanner(interaction, message, client);
          break;
        case "restart":
          await handleRestart(interaction, message, client);
          break;
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason === "cancel") return;
      try {
        await menuMessage.edit({
          content: "**انتهى الوقت ⏰**",
          components: [],
        });
      } catch {}
    });
  },
};


const handleSetAvatar = async (interaction, message, client) => {
  await interaction.message.delete().catch(() => {});
  const replyMessage = await message.reply("**يرجى إرفاق الصورة أو رابطها ** ⚙️");

  const messageCollector = message.channel.createMessageCollector({
    filter: (msg) => msg.author.id === message.author.id,
    max: 1,
    time: 60_000,
  });

  messageCollector.on("collect", async (msg) => {
    try {
      if (msg.attachments.size > 0) {
        const url = msg.attachments.first().url;
        await client.user.setAvatar(url);
        await replyMessage.edit("**تم تغير صورة البوت ** ✅");
      } else if (msg.content.startsWith("http")) {
        await client.user.setAvatar(msg.content);
        await replyMessage.edit("**تم تغير صورة البوت ** ✅");
      } else {
        await replyMessage.edit("**يرجى إرفاق الصورة أو رابطها ** ⚙️");
      }
    } catch (e) {
      await replyMessage.edit(`**تعذر تغيير الصورة: \`${e.message}\`**`);
    }
    await msg.delete().catch(() => {});
  });
};

const handleSetName = async (interaction, message, client) => {
  await interaction.message.delete().catch(() => {});
  const setNameReply = await message.reply("**يرجى إدخال أسم البوت الجديد ** ⚙️");

  const nameCollector = message.channel.createMessageCollector({
    filter: (msg) => msg.author.id === message.author.id,
    max: 1,
    time: 60_000,
  });

  nameCollector.on("collect", async (msg) => {
    try {
      await client.user.setUsername(msg.content);
      await setNameReply.edit("**تم تغير إسم البوت ✅**");
    } catch (e) {
      await setNameReply.edit(`**تعذر تغيير الاسم: \`${e.message}\`**`);
    }
    await msg.delete().catch(() => {});
  });
};

const handleSetStatus = async (interaction, message, client) => {
  await interaction.message.delete().catch(() => {});
  await message.reply("**يرجى كتابة الحالة الجديدة للبوت **");

  const statusCollector = message.channel.createMessageCollector({
    filter: (msg) => msg.author.id === message.author.id,
    max: 1,
    time: 60_000,
  });

  statusCollector.on("collect", async (msg) => {
    const newStatusText = msg.content;
    const statusTypeReply = await message.channel.send(
      `**يرجى اختيار نوع الحالة لـ "${newStatusText}":**`
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("watching").setLabel("📺 Watching").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("listening").setLabel("🎧 Listening").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("streaming").setLabel("🎥 Streaming").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("playing").setLabel("🎮 Playing").setStyle(ButtonStyle.Secondary),
    );

    await statusTypeReply.edit({ components: [row] });

    const filter = (btn) =>
      btn.user.id === msg.author.id && btn.message.id === statusTypeReply.id;

    const btnCollector = message.channel.createMessageComponentCollector({
      filter,
      time: 60_000,
    });

    btnCollector.on("collect", async (btn) => {
      let type = ActivityType.Playing;
      if (btn.customId === "watching") type = ActivityType.Watching;
      if (btn.customId === "listening") type = ActivityType.Listening;
      if (btn.customId === "streaming") type = ActivityType.Streaming;

      try {
        await client.user.setPresence({
          activities: [{ name: newStatusText, type }],
          status: client.presence?.status || "online",
        });

        await btn.update({
          content: `**تم تغيير حالة البوت إلى "${newStatusText}"** ✅`,
          components: [],
        });
      } catch (e) {
        console.error(e);
        await message.channel.send(
          `**فشل التغيير: \`${e.message}\`**`
        ).catch(() => {});
      }

      btnCollector.stop("done");
    });

    btnCollector.on("end", async (_, reason) => {
      if (reason !== "done") {
        try {
          await statusTypeReply.edit({
            content: "**انتهى الوقت لتغيير الحالة. ⏰**",
            components: [],
          });
        } catch {}
      }
    });
  });
};

const handleSetBanner = async (interaction, message, client) => {
  await interaction.message.delete().catch(() => {});
  const replyMessage = await message.reply("**يرجى إرفاق الصورة أو رابطها ** ⚙️");

  const messageCollector = message.channel.createMessageCollector({
    filter: (msg) => msg.author.id === message.author.id,
    max: 1,
    time: 60_000,
  });

  messageCollector.on("collect", async (msg) => {
    if (msg.attachments.size > 0) {
      const bannerAttachment = msg.attachments.first();
      const valid = ["image/png", "image/gif", "image/jpeg"];
      if (!valid.includes(bannerAttachment.contentType)) {
        await replyMessage.edit("**يرجى إرسال صورة بصيغة PNG، GIF أو JPEG.**");
        return;
      }
      try {
        const response = await fetch(bannerAttachment.url);
        const buffer = await response.buffer();
        const rest = new REST({ version: "10" }).setToken(client.token);
        await rest.patch(Routes.user(), {
          body: {
            banner: `data:${bannerAttachment.contentType};base64,${buffer.toString(
              "base64"
            )}`,
          },
        });
        await replyMessage.edit("**تم تغير بانر البوت ** ✅");
      } catch (error) {
        await replyMessage.edit(
          `**حدث خطأ أثناء تحديث البانر: \`${error.message}\`**`
        );
      }
    } else if (msg.content.startsWith("http")) {
      await replyMessage.edit("**يرجى إرفاق الصورة كمرفق.**");
    } else {
      await replyMessage.edit("**يرجى إرفاق صورة أو رابط صحيح. ** ⚙️");
    }
    await msg.delete().catch(() => {});
  });
};

const handleSetColor = async (interaction, message) => {
  await interaction.message.delete().catch(() => {});
  const setColorReply = await message.reply(
    "**يرجى إرسال كود اللون بصيغة Hex (مثل #FF5733)** ⚙️"
  );

  const colorCollector = message.channel.createMessageCollector({
    filter: (msg) => msg.author.id === interaction.user.id,
    max: 1,
    time: 30_000,
  });

  colorCollector.on("collect", async (msg) => {
    const color = msg.content.trim();
    const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (!hexColorRegex.test(color)) {
      await setColorReply.edit(
        "**كود اللون غير صالح، يرجى إدخال كود HEX صحيح.** ⚠️"
      );
      await msg.delete().catch(() => {});
      return;
    }
    await Data.set(`bot_color_${interaction.user.id}`, color);
    await setColorReply.edit(`**تم تغيير لون البوت إلى ${color} ✅**`);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("تم تغير لون البوت!")
      .setDescription(`لون البوت الحالي هو: ${color}`);

    await message.channel.send({ embeds: [embed] });
    await msg.delete().catch(() => {});
  });

  colorCollector.on("end", (_, reason) => {
    if (reason === "time")
      setColorReply.edit("**انتهى الوقت، لم يتم تغيير لون البوت.** ⏳");
  });
};

const handleRestart = async (interaction, message, client) => {
  await interaction.message.delete().catch(() => {});
  await message.channel.send("أعيد تشغيل البوت...").catch(() => {});
  try {
    await client.destroy();
    const cfg = require(`${process.cwd()}/config`);
    await client.login(cfg.token);
    await message.channel.send("تم إعادة تشغيل البوت بنجاح! ✅");
  } catch (error) {
    await message.channel.send(
      `حدث خطأ أثناء إعادة تشغيل البوت: ${error.message} ❌`
    );
  }
};
