const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  Colors,
} = require("discord.js");
const Pro = require("pro.db");
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "block",
  description: "إضافة عضو للبلاك ليست + طرده مع سبب محدد وتسجيل العملية",
  run: async (client, message, args) => {
    if (!message.guild) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#1e1f22";

    const allowDb = Pro.get(`Allow - Command block = [ ${message.guild.id} ]`);
    const allowedRole = allowDb ? message.guild.roles.cache.get(allowDb) : null;
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === allowDb ||
      message.member.permissions.has(PermissionsBitField.Flags.KickMembers) ||
      owners.includes(message.author.id);

    if (!isAuthorAllowed) return; 

    const mentioned = message.mentions.users.first();
    const targetId = mentioned?.id || args?.[0];

    if (!targetId) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة.\n block <@${message.author.id}>**`
        );
      return message.reply({ embeds: [embed] });
    }

    const reasons = [
      { label: "الحسابات الوهمية", description: "مؤبد", value: "الحسابات الوهمية" },
      { label: "قذف - سب - روابط", description: "مؤبد", value: "قذف - سب - روابط" },
      { label: "دخول وخروج من سيرفر", description: "مؤبد", value: "دخول وخروج من سيرفر" },
      { label: "الدخول الي خاص والنشر", description: "مؤبد", value: "الدخول الي خاص والنشر" },
      { label: "فري ميك - سب في الاصوات", description: "مؤبد", value: "فري ميك - سب في الاصوات" },
    ];

    const reasonMenu = new StringSelectMenuBuilder()
      .setCustomId("block_reason")
      .setPlaceholder("اختر سبب الحظر")
      .addOptions(reasons);

    const cancelBtn = new ButtonBuilder()
      .setCustomId("Cancel4")
      .setLabel("الغاء")
      .setStyle(ButtonStyle.Secondary);

    const rowMenu = new ActionRowBuilder().addComponents(reasonMenu);
    const rowButtons = new ActionRowBuilder().addComponents(cancelBtn);

    const promptMsg = await message.reply({
      content: `**يرجي تحديد سبب البلاك لست.**\n** • <@${targetId}>**`,
      components: [rowMenu, rowButtons],
    });

    const filter = (i) =>
      i.user.id === message.author.id &&
      (i.customId === "block_reason" || i.customId === "Cancel4");

    const collector = promptMsg.createMessageComponentCollector({
      filter,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      try {
        if (i.customId === "Cancel4") {
          await i.update({ content: "تم الإلغاء.", components: [] });
          return;
        }

        if (i.customId === "block_reason") {
          const selectedReason = i.values[0];

          try {
            await message.guild.members.kick(targetId, selectedReason);
          } catch (err) {
            await i.update({
              content:
                "❌ لا يمكنني طرد هذا العضو. تأكد من صلاحياتي وترتيب الرتب.",
              components: [],
            });
            return;
          }

          await Pro.set(`blocked:${message.guild.id}:${targetId}`, {
            by: message.author.id,
            reason: selectedReason,
            ts: Date.now(),
          });

          const selectedUser = await client.users.fetch(targetId).catch(() => null);

          const logblocklist = Pro.get(`logblocklist_${message.guild.id}`);
          const blockChannel = logblocklist
            ? message.guild.channels.cache.get(logblocklist)
            : null;

          if (blockChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle("Blacklist")
              .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: false }),
              })
              .addFields(
                { name: "User", value: `<@${targetId}>`, inline: true },
                { name: "By", value: `<@${message.author.id}>`, inline: true },
                { name: "Time", value: "`( مؤبد )`", inline: true },
                { name: "Reason", value: selectedReason, inline: true }
              )
              .setColor("#525C74")
              .setFooter({
                text: selectedUser?.username || "Unknown User",
                iconURL: selectedUser?.displayAvatarURL({
                  extension: "png",
                  forceStatic: false,
                  size: 128,
                }),
              });

            blockChannel.send({ embeds: [logEmbed] }).catch(() => {});
          }

          const logkick = Pro.get(`logkick_${message.guild.id}`);
          const kickChannel = logkick
            ? message.guild.channels.cache.get(logkick)
            : null;

          if (kickChannel) {
            const kickEmbed = new EmbedBuilder()
              .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: false }),
              })
              .setDescription(
                `**طرد عضو**\n\n**العضو : <@${targetId}>**\n**بواسطة : <@${message.author.id}>**\n\`\`\`Reason : ${selectedReason}\`\`\``
              )
              .setColor("#493042")
              .setFooter({
                text: selectedUser?.username || "Unknown User",
                iconURL: selectedUser?.displayAvatarURL({
                  extension: "png",
                  forceStatic: false,
                  size: 128,
                }),
              });

            kickChannel.send({ embeds: [kickEmbed] }).catch(() => {});
          }

          await i.update({ content: "✅ تم تطبيق البلاك وطرد العضو.", components: [] });
          message.react("✅").catch(() => {});
        }
      } catch (err) {
        console.error(err);
        try {
          await i.update({ content: "حدث خطأ غير متوقع.", components: [] });
        } catch {}
        message.react("❌").catch(() => {});
      }
    });

    collector.on("end", async () => {
      if (!promptMsg.editable) return;
      try {
        await promptMsg.edit({ components: [] });
      } catch {}
    });
  },
};
