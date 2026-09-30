const { EmbedBuilder, Colors } = require("discord.js");
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
  name: "rerole",
  description: "إزالة عضو من قروب محدد (بالاسم أو آيدي الكاتجوري).",
  usage: ["rerole <groupNameOrCategoryId> @user"],
  run: async (client, message, args) => {
    if (args.length < 2) return message.reply("اكتب اسم القروب/آيدي الكاتجوري ثم منشن العضو.");

    const key = args[0];
    const target = message.mentions.members.first();
    if (!target) return message.reply("منشن عضو صحيح.");

    const groupInfo = await resolveGroup(Data, message.guild, key);
    if (!groupInfo) return message.reply("القروب غير موجود.");

    const isOwner = message.author.id === groupInfo.ownerId;
    const isAdmin = (groupInfo.admins || []).includes(message.author.id);
    if (!isOwner && !isAdmin) return message.reply("ليست لديك صلاحية إدارة هذا القروب.");

    const role = message.guild.roles.cache.get(groupInfo.roleId);
    if (!role) return message.reply("رول القروب غير موجود (قد يكون تم حذفه).");

    if (!target.roles.cache.has(role.id)) return message.reply("العضو ليس داخل هذا القروب.");

    try {
      await target.roles.remove(role);
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setDescription(`✅ تمت إزالة <@${target.id}> من القروب **${groupInfo.name}**.`),
        ],
      });
    } catch (e) {
      console.error("Remove member error:", e);
      return message.reply("حدث خطأ أثناء إزالة العضو. تحقق من الصلاحيات.");
    }
  },
};
