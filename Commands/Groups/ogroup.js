const { EmbedBuilder, Colors, PermissionsBitField } = require("discord.js");
const Data = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

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
  name: "ogroup",
  aliases: ["ownergroup"],
  description: "نقل ملكية القروب لعضو معين (بالاسم او ايدي الكاتجوري).",
  usage: ["ogroup <groupNameOrCategoryId> @user"],
  run: async (client, message, args) => {
    const can =
      message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
      owners.includes(message.author.id);
    if (!can) return message.reply("لا تملك صلاحية ادارة الرول.");

    if (args.length < 2) return message.reply("اكتب اسم القروب/آيدي الكاتجوري ثم منشن المالك الجديد.");

    const key = args[0];
    const newOwner = message.mentions.members.first();
    if (!newOwner) return message.reply("منشن المستخدم المراد منحه الملكية.");

    const groupInfo = await resolveGroup(Data, message.guild, key);
    if (!groupInfo) return message.reply("القروب غير موجود.");

    const role = message.guild.roles.cache.get(groupInfo.roleId);
    if (!role) return message.reply("رول القروب غير موجود (قد يكون تم حذفه).");

    try {
      if (!newOwner.roles.cache.has(role.id)) {
        await newOwner.roles.add(role);
      }

      const oldOwnerId = groupInfo.ownerId;
      groupInfo.ownerId = newOwner.id;

      const cur = await Data.get(`user_group_${oldOwnerId}_${message.guild.id}`);
      if (cur === groupInfo.slug) {
        await Data.delete(`user_group_${oldOwnerId}_${message.guild.id}`);
      }

      await Data.set(`user_group_${newOwner.id}_${message.guild.id}`, groupInfo.slug);
      await saveGroupMappings(Data, message.guild.id, groupInfo);

      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle("تم نقل ملكية القروب")
        .setDescription(`القروب **${groupInfo.name}** صار تحت إدارة <@${newOwner.id}> الآن!`)
        .addFields(
          { name: "المالك الجديد", value: `<@${newOwner.id}>`, inline: true },
          { name: "المالك السابق", value: `<@${oldOwnerId}>`, inline: true },
          { name: "الكاتجوري", value: `<#${groupInfo.categoryId}>`, inline: false }
        )
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } catch (e) {
      console.error("Grant ownership error:", e);
      message.reply("حدث خطأ أثناء نقل الملكية. تحقق من صلاحياتي ثم حاول مجددًا.");
    }
  },
};
