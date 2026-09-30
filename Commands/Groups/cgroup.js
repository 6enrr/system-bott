const {
  EmbedBuilder,
  Colors,
  ChannelType,
  PermissionFlagsBits,
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
  await Data.set(
    `group_by_category_${guildId}_${groupInfo.categoryId}`,
    groupInfo.slug
  );
  await Data.set(`group_by_role_${guildId}_${groupInfo.roleId}`, groupInfo.slug);
  await Data.set(`user_group_${groupInfo.ownerId}_${guildId}`, groupInfo.slug);
}

module.exports = {
  name: "cgroup",
  description: "يسوي قروب (كاتجوري) مع شات وصوت ورول بخطوات",
  usage: ["cgroup"],
  run: async (client, message) => {
    if (message.mentions.has(client.user)) return message.reply("لا تمنشن البوت");

    let ownerId = null;
    try {
      ownerId = await Promise.resolve(Data.get(`group_owner_${message.guild.id}`));
    } catch (e) {
      ownerId = null;
    }

    const canCreate =
      message.member.permissions.has(PermissionsBitField.Flags.ManageChannels) ||
      (ownerId && message.author.id === ownerId);

    if (!canCreate) return message.reply("ما عندك صلاحية تسوي قروب");

    const filter = (m) => m.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({
      filter,
      max: 5,
      time: 60_000,
    });

    let ownerMention, groupNameRaw, textNameRaw, voiceNameRaw, roleNameRaw;

    await message.channel.send("1) منشن مالك القروب:");

    collector.on("collect", async (m) => {
      if (!ownerMention) {
        ownerMention = m.mentions.members.first();
        if (!ownerMention) return message.channel.send("منشن واحد صح يكون مالك");
        return message.channel.send("2) اكتب اسم القروب (بيكون اسم الكاتجوري):");
      }

      if (!groupNameRaw) {
        groupNameRaw = m.content.trim();
        const slug = normalizeGroupName(groupNameRaw);
        if (!slug) return message.channel.send("اسم القروب مو مناسب, جرب اسم ثاني");

        const exists = await Data.get(groupKey(message.guild.id, slug));
        if (exists) return message.channel.send("فيه قروب بنفس الاسم, غير الاسم");

        return message.channel.send("3) اكتب اسم الشات:");
      }

      if (!textNameRaw) {
        textNameRaw = m.content.trim();
        if (!textNameRaw) return message.channel.send("اسم الشات مو مناسب");
        return message.channel.send("4) اكتب اسم الروم الصوتي:");
      }

      if (!voiceNameRaw) {
        voiceNameRaw = m.content.trim();
        if (!voiceNameRaw) return message.channel.send("اسم الصوت مو مناسب");
        return message.channel.send("5) اكتب اسم الرول:");
      }

      if (!roleNameRaw) {
        roleNameRaw = m.content.trim();
        if (!roleNameRaw) return message.channel.send("اسم الرول مو مناسب");
        collector.stop("done");
      }
    });

    collector.on("end", async (_col, reason) => {
      if (reason !== "done") {
        return message.channel.send("خلص الوقت او ما كملت البيانات, جرب من جديد");
      }

      const slug = normalizeGroupName(groupNameRaw);
      if (!slug) return;

      try {
        const category = await message.guild.channels.create({
          name: groupNameRaw,
          type: ChannelType.GuildCategory,
        });

        const textChannel = await message.guild.channels.create({
          name: textNameRaw,
          type: ChannelType.GuildText,
          parent: category.id,
        });

        const voiceChannel = await message.guild.channels.create({
          name: voiceNameRaw,
          type: ChannelType.GuildVoice,
          parent: category.id,
        });

        const groupRole = await message.guild.roles.create({
          name: roleNameRaw,
          color: "Blue",
          permissions: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
          ],
        });

        await setOverwrites(category, groupRole, message.guild);
        await setOverwrites(textChannel, groupRole, message.guild);
        await setOverwrites(voiceChannel, groupRole, message.guild);

        await ownerMention.roles.add(groupRole);

        const admins = Array.from(new Set([ownerMention.id, message.author.id]));

        const groupInfo = {
          slug,
          name: groupNameRaw,
          ownerId: ownerMention.id,
          admins,
          categoryId: category.id,
          roleId: groupRole.id,
          roleName: groupRole.name,
          textChannelId: textChannel.id,
          voiceChannelId: voiceChannel.id,
          createdAt: Date.now(),
        };

        await saveGroupMappings(Data, message.guild.id, groupInfo);

        const adminsText = admins.map((id) => `<@${id}>`).join(", ");

        const embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle("تم انشاء القروب")
          .setDescription(
            `القروب: ${groupNameRaw}\n` +
              `الشات: <#${textChannel.id}>\n` +
              `الصوت: <#${voiceChannel.id}>\n` +
              `الرول: <@&${groupRole.id}>\n\n` +
              `المالك: <@${ownerMention.id}>\n` +
              `الادمنين: ${adminsText}`
          );

        await message.channel.send({ embeds: [embed] });

        ownerMention
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Blurple)
                .setTitle("مبروك")
                .setDescription(
                  `صرت مالك قروب: ${groupNameRaw}\n` +
                    `عشان لوحة التحكم اكتب: panel قروبي`
                ),
            ],
          })
          .catch(() => {});
      } catch (e) {
        console.error("Create group error:", e);
        return message.reply("صار خطا وانا اسوي القروب, تاكد من صلاحيات البوت");
      }
    });
  },
};

async function setOverwrites(channel, role, guild) {
  await channel.permissionOverwrites.set([
    {
      id: role.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
      ],
    },
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
  ]);
}