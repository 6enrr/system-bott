const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Colors,
} = require("discord.js");
const Data = require("pro.db");

function normalizeGroupName(input) {
  if (!input) return null;
  const cleaned = String(input)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s_-]+/gu, ""); 
  if (!cleaned) return null;
  return cleaned.toLowerCase().replace(/\s+/g, "-");
}

function groupKey(guildId, slug) {
  return `group_${guildId}_${slug}`;
}

async function resolveGroup(Data, guild, key) {
  if (!key) return null;
  const str = String(key).trim();

  if (/^\d+$/.test(str)) {
    const slug = await Data.get(`group_by_category_${guild.id}_${str}`);
    if (!slug) return null;
    return Data.get(groupKey(guild.id, slug));
  }

  const slug = normalizeGroupName(str);
  if (!slug) return null;
  return Data.get(groupKey(guild.id, slug));
}

async function saveGroupMappings(Data, guildId, groupInfo) {
  await Data.set(groupKey(guildId, groupInfo.slug), groupInfo);
  await Data.set(`group_by_category_${guildId}_${groupInfo.categoryId}`, groupInfo.slug);
  await Data.set(`group_by_role_${guildId}_${groupInfo.roleId}`, groupInfo.slug);
  await Data.set(`user_group_${groupInfo.ownerId}_${guildId}`, groupInfo.slug);
}

async function deleteGroupMappings(Data, guildId, groupInfo) {
  await Data.delete(groupKey(guildId, groupInfo.slug));
  await Data.delete(`group_by_category_${guildId}_${groupInfo.categoryId}`);
  await Data.delete(`group_by_role_${guildId}_${groupInfo.roleId}`);

  const current = await Data.get(`user_group_${groupInfo.ownerId}_${guildId}`);
  if (current === groupInfo.slug) {
    await Data.delete(`user_group_${groupInfo.ownerId}_${guildId}`);
  }
}


module.exports = {
  name: "panel",
  description: "عرض معلومات القروب والتحكم السريع.",
  usage: ["panel <groupNameOrCategoryId|قروبي>"],
  run: async (client, message, args) => {
    let key = args[0];
    if (!key) return message.reply("اكتب اسم القروب أو آيدي الكاتجوري أو (قروبي).");

    if (key === "قروبي") {
      const slug = await Data.get(`user_group_${message.author.id}_${message.guild.id}`);
      if (!slug) return message.reply("لا يوجد لديك قروب (ملكية) في هذا السيرفر.");
      key = slug;
    }

    const groupInfo = await resolveGroup(Data, message.guild, key);
    if (!groupInfo) return message.reply("القروب غير موجود (تحقق من الاسم/الآيدي).");

    const isOwner = message.author.id === groupInfo.ownerId;
    const isAdmin = (groupInfo.admins || []).includes(message.author.id);
    if (!isOwner && !isAdmin) return message.reply("ليس لديك صلاحيات لاستخدام لوحة هذا القروب.");

    const owner = await message.guild.members.fetch(groupInfo.ownerId).catch(() => null);
    const role =
      message.guild.roles.cache.get(groupInfo.roleId) ||
      message.guild.roles.cache.find((r) => r.name === groupInfo.roleName);

    if (!owner) return message.reply("تعذر العثور على مالك القروب.");
    if (!role) return message.reply("تعذر العثور على رول القروب (قد يكون تم حذفه).");

    const members = message.guild.members.cache.filter((m) => m.roles.cache.has(role.id));
    const memberCount = members.size;
    const adminCount = (groupInfo.admins || []).length;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`g_add_member:${groupInfo.slug}`).setLabel("إضافة عضو").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`g_remove_member:${groupInfo.slug}`).setLabel("إزالة عضو").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`g_list_members:${groupInfo.slug}`).setLabel("عرض الأعضاء").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`g_add_admin:${groupInfo.slug}`).setLabel("إضافة أدمن").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`g_remove_admin:${groupInfo.slug}`).setLabel("إزالة أدمن").setStyle(ButtonStyle.Danger),
    );

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("لوحة القروب")
      .setDescription(`تفاصيل القروب **${groupInfo.name}**`)
      .addFields(
        { name: "المالك", value: owner.user.tag, inline: true },
        { name: "الأعضاء", value: String(memberCount), inline: true },
        { name: "الأدمن", value: String(adminCount), inline: true },
        { name: "الكاتجوري", value: groupInfo.categoryId ? `<#${groupInfo.categoryId}>` : "—", inline: false },
        { name: "الرول", value: `<@&${role.id}>`, inline: false },
      )
      .setFooter({ text: `طلب من ${message.author.tag}` })
      .setTimestamp();

    const panelMsg = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = panelMsg.createMessageComponentCollector({
      time: 120_000,
      filter: (i) => i.customId.includes(`:${groupInfo.slug}`),
    });

    collector.on("collect", async (interaction) => {
      const canUse =
        interaction.user.id === groupInfo.ownerId ||
        (groupInfo.admins || []).includes(interaction.user.id);

      if (!canUse) {
        return interaction.reply({ content: "لا تملك صلاحيات لاستخدام هذه الأزرار.", ephemeral: true });
      }

      const action = interaction.customId.split(":")[0];

      const freshRole = message.guild.roles.cache.get(groupInfo.roleId) || role;
      const freshMembers = message.guild.members.cache.filter((m) => m.roles.cache.has(freshRole.id));

      if (action === "g_list_members") {
        const list = freshMembers.map((m) => `<@${m.id}>`).join(", ") || "لا يوجد أعضاء.";
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(Colors.Blurple).setTitle("أعضاء القروب").setDescription(list)],
          ephemeral: true,
        });
      }

      const askMention = async (prompt) => {
        await interaction.reply({ content: prompt, ephemeral: true });

        const rf = (m) => m.author.id === interaction.user.id && m.mentions.members.size > 0;
        const mc = interaction.channel.createMessageCollector({ filter: rf, time: 20_000, max: 1 });

        return new Promise((resolve) => {
          mc.on("collect", (m) => resolve(m.mentions.members.first()));
          mc.on("end", (col) => col.size === 0 && resolve(null));
        });
      };

      if (action === "g_add_member") {
        const target = await askMention("منشن العضو اللي تبي تضيفه:");
        if (!target) return interaction.followUp({ content: "لم يتم منشن أي عضو.", ephemeral: true });
        if (target.roles.cache.has(freshRole.id)) return interaction.followUp({ content: "العضو موجود بالفعل بالقروب.", ephemeral: true });

        await target.roles.add(freshRole).catch(() => null);
        return interaction.followUp({ content: `✅ تمت إضافة <@${target.id}>.`, ephemeral: true });
      }

      if (action === "g_remove_member") {
        const target = await askMention("منشن العضو اللي تبي تشيله:");
        if (!target) return interaction.followUp({ content: "لم يتم منشن أي عضو.", ephemeral: true });
        if (!target.roles.cache.has(freshRole.id)) return interaction.followUp({ content: "العضو ليس ضمن القروب.", ephemeral: true });

        await target.roles.remove(freshRole).catch(() => null);
        return interaction.followUp({ content: `✅ تمت إزالة <@${target.id}>.`, ephemeral: true });
      }

      if (action === "g_add_admin") {
        const target = await askMention("منشن العضو اللي تبي تضيفه أدمن:");
        if (!target) return interaction.followUp({ content: "لم يتم منشن أي عضو.", ephemeral: true });
        if (target.id === groupInfo.ownerId) return interaction.followUp({ content: "المالك أصلاً لديه صلاحيات.", ephemeral: true });

        groupInfo.admins = Array.isArray(groupInfo.admins) ? groupInfo.admins : [];
        if (groupInfo.admins.includes(target.id)) return interaction.followUp({ content: "هو أدمن بالفعل.", ephemeral: true });

        groupInfo.admins.push(target.id);
        await saveGroupMappings(Data, message.guild.id, groupInfo);
        return interaction.followUp({ content: `✅ تمت إضافة <@${target.id}> كأدمن.`, ephemeral: true });
      }

      if (action === "g_remove_admin") {
        const target = await askMention("منشن الأدمن اللي تبي تشيله:");
        if (!target) return interaction.followUp({ content: "لم يتم منشن أي عضو.", ephemeral: true });

        groupInfo.admins = Array.isArray(groupInfo.admins) ? groupInfo.admins : [];
        if (!groupInfo.admins.includes(target.id)) return interaction.followUp({ content: "هذا العضو ليس أدمن.", ephemeral: true });

        groupInfo.admins = groupInfo.admins.filter((id) => id !== target.id);
        await saveGroupMappings(Data, message.guild.id, groupInfo);
        return interaction.followUp({ content: `✅ تمت إزالة <@${target.id}> من الأدمن.`, ephemeral: true });
      }
    });

    collector.on("end", async () => {
      const disabled = new ActionRowBuilder().addComponents(
        row.components.map((b) => ButtonBuilder.from(b).setDisabled(true))
      );
      panelMsg.edit({ components: [disabled] }).catch(() => {});
    });
  },
};
