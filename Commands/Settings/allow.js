const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
} = require("discord.js");
const Pro = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "سماح",
  aliases: ["allow"],
  description: "يسمح بإضافة صلاحيات لدور أو عضو محدد (المالكين فقط).",
  run: async function (client, message) {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      Colors.Blurple;

    const Args = message.content.split(" ");
    if (!Args[1]) {
      return sendReply(
        message,
        Color,
        `**يرجى استخدام الأمر بالطريقة الصحيحة.**\n سماح <@member or @role>`
      );
    }

    const Roles = message.mentions.roles.first() || message.guild.roles.cache.get(Args[1]);
    const Member = message.mentions.members.first() || message.guild.members.cache.get(Args[1]);
    if (!Roles && !Member) {
      return sendReply(message, Color, "**يرجى ارفاق منشن صحيح للرول أو العضو.**");
    }

    const permissions = definePermissions();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("permissionSelect")
      .setPlaceholder("يرجى أختيار الصلاحيات المُراد إضافتها")
      .setMinValues(1)
      .setMaxValues(permissions.length)
      .addOptions(
        permissions.map((p) => ({ label: p.name, value: p.value, emoji: p.emoji }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const cancelRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ItsCancel").setLabel("إلغاء").setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor(Color)
      .setTitle("يرجى تحديد الأمر.")
      .setFooter({ text: message.client.user.username, iconURL: message.client.user.displayAvatarURL() });

    const menuMessage = await message.reply({ embeds: [embed], components: [row, cancelRow] });

    const filter = (i) => i.user.id === message.author.id;
    const collector = menuMessage.createMessageComponentCollector({ filter, time: 60_000 });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "ItsCancel" && interaction.isButton()) {
        collector.stop();
        await interaction.message.delete().catch(() => {});
        return interaction.reply({ content: "تم إلغاء العملية.", ephemeral: true });
      }

      if (interaction.customId === "permissionSelect" && interaction.isStringSelectMenu()) {
        const chosenPermissions = interaction.values;
        const targetId = Roles ? Roles.id : Member.id;
        await grantPermissions(chosenPermissions, targetId, permissions, Color, menuMessage);
        await interaction.reply({ content: "صلاحيات تم إضافته!", ephemeral: true });
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        menuMessage.edit({ content: "لم يتم اختيار الصلاحيات، حاول مرة أخرى.", components: [] }).catch(() => {});
      }
    });
  },
};

function sendReply(message, color, description) {
  const embed = new EmbedBuilder().setColor(color).setDescription(description);
  return message.reply({ embeds: [embed] });
}
function definePermissions() {
  return [
    { name: "حظر وفك", value: "ban", emoji: "📋" },
    { name: "الطرد", value: "kick", emoji: "📋" },
    { name: "السجن", value: "prison", emoji: "📋" },
    { name: "الأسكاتي الكتابي", value: "mute", emoji: "📋" },
    { name: "الميوت الصوتي", value: "vmute", emoji: "📋" },
    { name: "اعطاء إزالة رول", value: "role", emoji: "📋" },
    { name: "اعطاء إزالة إنشاء, رول للجميع", value: "allrole", emoji: "📋" },
    { name: "الرولات الخاصة", value: "srole", emoji: "📋" },
    { name: "المسح", value: "clear", emoji: "📋" },
    { name: "الصور ،الهير ،الكام", value: "pic", emoji: "📋" },
    { name: "سحب ،ودني", value: "move", emoji: "📋" },
    { name: "قفل فتح", value: "lock", emoji: "📋" },
    { name: "اخفاء اظهار", value: "hide", emoji: "📋" },
    { name: "معلومات الرول", value: "check", emoji: "📋" },
    { name: "اوامر الانذارات", value: "warn", emoji: "📋" },
    { name: "إزالة إضافة الكنية", value: "setnick", emoji: "📋" },
  ];
}

async function grantPermissions(chosenPermissions, targetId, permissions, color, menuMessage) {
  const grantedPermissions = [];
  const notGrantedPermissions = [];

  if (!chosenPermissions.length || !permissions.length) {
    const mention = menuMessage.guild.roles.cache.has(targetId) ? `<@&${targetId}>` : `<@${targetId}>`;
    const permissionsEmbed = new EmbedBuilder()
      .setColor(color)
      .setFooter({ text: menuMessage.client.user.username, iconURL: menuMessage.client.user.displayAvatarURL() })
      .setTitle("إستخدام غير ناجح ❌")
      .setDescription(`\`صلاحيات\` **${mention}**:\n\n**لا توجد صلاحيات متاحة لهذا الدور أو العضو.**`);
    await menuMessage.edit({ embeds: [permissionsEmbed], components: [] });
    return;
  }

  for (const permission of chosenPermissions) {
    const permissionKey = `Allow - Command ${permission} = [ ${menuMessage.guild.id} ]`;
    const existingPermission = Pro.get(permissionKey);
    if (existingPermission && existingPermission === targetId) {
      notGrantedPermissions.push(permission);
    } else {
      Pro.set(permissionKey, targetId);
      grantedPermissions.push(permission);
    }
  }

  const mention = menuMessage.guild.roles.cache.has(targetId) ? `<@&${targetId}>` : `<@${targetId}>`;
  const grantedList =
    grantedPermissions.length > 0
      ? grantedPermissions.map(p => `**✅ | ${permissions.find(x => x.value === p).name}**`).join("\n")
      : "";

  const notGrantedList =
    notGrantedPermissions.length > 0
      ? notGrantedPermissions.map(p => `**🚫 | ${permissions.find(x => x.value === p).name}** تم منحها بالفعل.`).join("\n")
      : "";

  const permissionsEmbed = new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: menuMessage.client.user.username, iconURL: menuMessage.client.user.displayAvatarURL() })
    .setTitle("إستخدام ناجح ✅")
    .setDescription(`\`صلاحيات\` **${mention}** \`الآن\`:\n\n${grantedList}${notGrantedPermissions.length ? `\n${notGrantedList}` : ""}`);

  await menuMessage.edit({ embeds: [permissionsEmbed], components: [] });
}
