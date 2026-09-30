const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const ms = require("ms");
const moment = require("moment");
const db = require("pro.db");

module.exports = {
  name: "prison",
  aliases: ["سجن"],
  run: async (client, message) => {
    const isEnabled = db.get(
      `command_enabled_${module.exports.name}`
    );
    if (isEnabled === false) return;

    const Color =
      db.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";

    const allowDb = db.get(
      `Allow - Command prison = [ ${message.guild.id} ]`
    );
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(
      allowedRole?.id
    );

    if (
      !isAuthorAllowed &&
      message.author.id !== allowDb &&
      !message.member.permissions.has("MuteMembers")
    ) {
      return message.reply("❌ - **ليس لديك الصلاحية لتنفيذ هذا الأمر.**");
    }

    const args = message.content.split(" ").slice(1);
    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة .\n سجن <@user>**`
        );
      return message.reply({ embeds: [embed] });
    }

    if (member.id === message.member.id || member.user.bot) {
      return message.react("❌");
    }

    if (
      message.member.roles.highest.position <=
      member.roles.highest.position
    ) {
      return message.react("❌");
    }

    const menuOptions = [
      { label: "مشاكل متكررة | 1", value: "مشاكل متكررة" },
      { label: "قذف , سب , تشفير | 2", value: "قذف , سب , تشفير" },
      { label: "يدخل حسابات وهمية | 3", value: "يدخل حسابات وهمية" },
      { label: "يُروج فالخاص لسيرفر | 4", value: "يُروج فالخاص لسيرفر" },
    ];

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`prison_menu_${message.id}_${member.id}`)
      .setPlaceholder("اختر عقوبة العضو ووقت السجن")
      .addOptions(menuOptions);

    const deleteButton = new ButtonBuilder()
      .setCustomId(`prison_cancel_${message.id}_${member.id}`)
      .setLabel("الغاء")
      .setStyle(ButtonStyle.Secondary);

    const menuRow = new ActionRowBuilder().addComponents(menu);
    const buttonRow = new ActionRowBuilder().addComponents(deleteButton);

    await message.reply({
      content: `**يرجي تحديد سبب العقوبه.**\n** * <@${member.id}>**`,
      components: [menuRow, buttonRow],
    });

    db.set(`prison_ctx_${message.id}`, {
      guildId: message.guild.id,
      channelId: message.channel.id,
      targetId: member.id,
      authorId: message.author.id,
    });
  },
};
