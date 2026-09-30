const {
  EmbedBuilder,
  Colors,
  ChannelType,
  PermissionsBitField,
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
  name: "delgroup",
  aliases: ["deletegroup"],
  description: "حذف قروب (كاتجوري) مع قنواته وروله.",
  usage: ["delgroup <groupNameOrCategoryId>"],
  run: async (client, message, args) => {
    if (!args.length) return message.reply("اكتب اسم القروب أو آيدي الكاتجوري المراد حذفه.");

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply("لا تملك صلاحية حذف القنوات.");

    const key = args[0];
    const groupInfo = await resolveGroup(Data, message.guild, key);
    if (!groupInfo) return message.reply("القروب غير موجود.");

    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setDescription(
        `هل أنت متأكد أنك تريد حذف القروب **${groupInfo.name}** وجميع قنواته؟ العملية غير قابلة للتراجع.`
      );

    const ask = await message.channel.send({ embeds: [embed] });
    await ask.react("✅");
    await ask.react("❌");

    const filter = (r, u) => ["✅", "❌"].includes(r.emoji.name) && u.id === message.author.id;

    ask
      .awaitReactions({ filter, max: 1, time: 30_000, errors: ["time"] })
      .then(async (col) => {
        const r = col.first();
        if (r.emoji.name !== "✅") return message.channel.send("تم إلغاء حذف القروب.");

        try {
          const category = message.guild.channels.cache.get(groupInfo.categoryId);
          if (category && category.type === ChannelType.GuildCategory) {
            const children = message.guild.channels.cache.filter((ch) => ch.parentId === category.id);
            for (const ch of children.values()) {
              await ch.delete(`Deleting channel of group: ${groupInfo.name}`);
            }
            await category.delete("Group deletion requested by user.");
          }

          const role = message.guild.roles.cache.get(groupInfo.roleId);
          if (role) await role.delete("Group role deletion requested by user.");

          await deleteGroupMappings(Data, message.guild.id, groupInfo);

          message.channel.send(`✅ تم حذف القروب **${groupInfo.name}** بنجاح.`);
        } catch (e) {
          console.error(e);
          message.reply("حدث خطأ أثناء حذف القروب. حاول لاحقًا.");
        }
      })
      .catch(() => message.reply("لم يتم التفاعل في الوقت المحدد. تم إلغاء الحذف."));
  },
};
