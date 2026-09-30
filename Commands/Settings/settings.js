const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");
const Data = require("pro.db");

module.exports = {
  name: "settings",
  description: "تعديل إعدادات السيرفر",
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.react("❌");

    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("settingsMenu")
        .setPlaceholder("اختر إحدى الخيارات")
        .addOptions(
          { label: "تغيير اسم السيرفر", value: "change_name" },
          { label: "تغيير صورة السيرفر", value: "change_avatar" },
        )
    );

    const cancelRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("Cancel").setLabel("إلغاء").setStyle(ButtonStyle.Danger)
    );

    const panel = await message.reply({
      content: "**قائمة إعدادات السيرفر ⚙️**",
      components: [selectMenu, cancelRow],
    });

    const filter = (i) =>
      i.user.id === message.author.id &&
      (i.customId === "settingsMenu" || i.customId === "Cancel");
    const collector = panel.createMessageComponentCollector({ filter, time: 60_000 });

    collector.on("collect", async (i) => {
      if (i.customId === "Cancel") {
        collector.stop("cancel");
        return i.update({ components: [] });
      }

      if (!i.isStringSelectMenu()) return;
      await i.deferUpdate();
      const choice = i.values[0];

      if (choice === "change_name") {
        const anti = Data.get(`antiServerName_${message.guild.id}`);
        if (anti) return message.reply("يرجى إيقاف حماية اسم السيرفر أولاً.");

        await message.reply("يرجى إدخال الاسم الجديد للسيرفر:");
        const f = (m) => m.author.id === message.author.id;
        const c = message.channel.createMessageCollector({ filter: f, time: 30_000 });

        c.on("collect", async (m) => {
          const newName = m.content?.trim();
          if (!newName) return message.reply("الاسم غير صالح.");
          await message.guild.setName(newName);
          await message.reply(`تم تغيير اسم السيرفر إلى **${newName}**.`);
          c.stop();
        });

        c.on("end", (col) => {
          if (col.size === 0) message.reply("لم تقم بإدخال اسم في الوقت المحدد.");
        });
      }

      if (choice === "change_avatar") {
        const anti = Data.get(`antiServerAvatar_${message.guild.id}`);
        if (anti) return message.reply("يرجى إيقاف حماية صورة السيرفر أولاً.");

        await message.reply("يرجى إرسال رابط الصورة الجديدة للسيرفر:");
        const f = (m) => m.author.id === message.author.id;
        const c = message.channel.createMessageCollector({ filter: f, time: 30_000 });

        c.on("collect", async (m) => {
          const url = m.content?.trim();
          if (!/^https?:\/\//i.test(url || "")) return message.reply("يرجى إدخال رابط صورة صالح.");

          try {
            await message.guild.setIcon(url);
            await message.reply("تم تغيير صورة السيرفر بنجاح.");
            c.stop();
          } catch {
            await message.reply("حدث خطأ أثناء تغيير صورة السيرفر. يرجى التحقق من الرابط.");
          }
        });

        c.on("end", (col) => {
          if (col.size === 0) message.reply("لم تقم بإدخال رابط للصورة في الوقت المحدد.");
        });
      }
    });

    collector.on("end", async () => {
      try { await panel.edit({ components: [] }); } catch {}
    });
  },
};
