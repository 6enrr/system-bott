const {
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const db = require("pro.db");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  name: "mcolors",
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
        const xCenter = (canvas.width - bg.width) / 2;
        const yCenter = (canvas.height - bg.height) / 2;
        ctx.drawImage(bg, xCenter, yCenter);
      } catch (e) {
      }
    }

    let x = 16;
    let y = canvasHeight / 2 - 55;

    sortedRoles.forEach((colorRole, index) => {
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

      const borderRadius = 17;
      ctx.beginPath();
      ctx.moveTo(x + borderRadius, y);
      ctx.lineTo(x + 70 - borderRadius, y);
      ctx.quadraticCurveTo(x + 70, y, x + 70, y + borderRadius);
      ctx.lineTo(x + 70, y + 70 - borderRadius);
      ctx.quadraticCurveTo(x + 70, y + 70, x + 70 - borderRadius, y + 70);
      ctx.lineTo(x + borderRadius, y + 70);
      ctx.quadraticCurveTo(x, y + 70, x, y + 70 - borderRadius);
      ctx.lineTo(x, y + borderRadius);
      ctx.quadraticCurveTo(x, y, x + borderRadius, y);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      const colorNumber = colorRole.name;
      ctx.font = "40px Arial";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "black";
      ctx.strokeText(colorNumber, x + 35, y + 35);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(colorNumber, x + 35, y + 35);
    });

    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "img.png",
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("mcolors_select")
      .setPlaceholder("قم باختيار اللون المناسب .")
      .addOptions(
        sortedRoles
          .map((r) => ({
            label: r.name,
            value: r.id,
            emoji: "🎨",
          }))
          .slice(0, 25)
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const sent = await message.reply({
      files: [attachment],
      components: [row],
    });

    const collector = sent.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60_000,
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.isStringSelectMenu()) return;
      if (interaction.customId !== "mcolors_select") return;

      const role = interaction.guild.roles.cache.get(
        interaction.values[0]
      );
      if (!role) {
        return interaction.reply({
          content: "الدور غير موجود.",
          ephemeral: true,
        });
      }

      const member = interaction.member;
      const currentColorRoles = member.roles.cache.filter(
        (r) => !isNaN(r.name) && !r.name.includes(".")
      );
      for (const r of currentColorRoles.values()) {
        await member.roles.remove(r).catch(() => {});
      }

      await member.roles.add(role).catch(() => {});
      await interaction.reply({
        content: "**تم تغيير اللون بنجاح**",
        ephemeral: true,
      });
    });

    collector.on("end", () => {
      sent.edit({ components: [] }).catch(() => {});
    });
  },
};
