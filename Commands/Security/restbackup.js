const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const fs = require("fs");

const loadBackup = () => {
  try {
    const backupData = fs.readFileSync("./Saved/backup.json");
    return JSON.parse(backupData);
  } catch (error) {
    console.error("Error while retrieving backup data:", error);
    return null;
  }
};

const mapChannelType = (t) => {
  if (typeof t === "number") return t;

  switch ((t || "").toUpperCase()) {
    case "GUILD_CATEGORY":
    case "CATEGORY":
      return ChannelType.GuildCategory;

    case "GUILD_TEXT":
    case "TEXT":
      return ChannelType.GuildText;

    case "GUILD_VOICE":
    case "VOICE":
      return ChannelType.GuildVoice;

    case "GUILD_ANNOUNCEMENT":
    case "GUILD_NEWS":
    case "NEWS":
      return ChannelType.GuildAnnouncement;

    case "GUILD_STAGE_VOICE":
    case "STAGE":
      return ChannelType.GuildStageVoice;

    case "GUILD_FORUM":
    case "FORUM":
      return ChannelType.GuildForum;

    case "GUILD_NEWS_THREAD":
    case "GUILD_PUBLIC_THREAD":
    case "GUILD_PRIVATE_THREAD":
      return ChannelType.GuildText;

    default:
      return ChannelType.GuildText;
  }
};

module.exports = {
  name: "restbackup",
  description:
    "استعادة النسخة الاحتياطية: يحذف كل القنوات/الرولات/الصور/الاسم ويعيد بناءها من backup.json",
  run: async (client, message) => {
    if (!message.guild) return;

    if (!owners.includes(message.author.id)) return message.react("❌");
    if (message.author.bot) return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_backup")
        .setLabel("نعم")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("cancel_backup")
        .setLabel("إلغاء")
        .setStyle(ButtonStyle.Danger)
    );

    const promptMsg = await message.reply({
      content:
        "**هل ترغب في استعادة النسخة الاحتياطية (Backup)؟**\n" +
        "عند الموافقة، **سيتم حذف جميع القنوات، والرولات (عدا @everyone والمدارة)، وصورة السيرفر واسم السيرفر** ثم إعادة بنائها من النسخة المحفوظة. 🛑",
      components: [row],
    });

    const filter = (i) =>
      i.user.id === message.author.id &&
      ["confirm_backup", "cancel_backup"].includes(i.customId);

    const collector = promptMsg.createMessageComponentCollector({
      filter,
      time: 15_000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "cancel_backup") {
        await interaction.update({
          content: "تم إلغاء عملية استعادة النسخة الاحتياطية.",
          components: [],
        });
        collector.stop("cancelled");
        return;
      }

      await interaction.update({
        content: "⏳ جاري استعادة النسخة الاحتياطية...",
        components: [],
      });

      const backupDataObj = loadBackup();
      if (!backupDataObj) {
        await interaction.editReply("❌ لا توجد بيانات نسخة احتياطية.");
        collector.stop("nobackup");
        return;
      }

      try {
        if (backupDataObj.serverName) {
          await message.guild.setName(backupDataObj.serverName);
        }

        try {
          const iconBuffer = fs.readFileSync("./Saved/icon.png");
          if (iconBuffer?.length) {
            await message.guild.setIcon(iconBuffer);
          }
        } catch (e) {
        }

        for (const role of message.guild.roles.cache.values()) {
          if (!role.managed && role.name !== "@everyone") {
            try {
              const fetchedRole = await message.guild.roles.fetch(role.id);
              if (fetchedRole) await fetchedRole.delete("Restoring backup");
            } catch (error) {
              console.error(`Error while deleting role: ${role.name}`, error);
            }
          }
        }

        const deletionInterval = 3000; 
        let index = 0;
        for (const channel of message.guild.channels.cache.values()) {
          setTimeout(async () => {
            try {
              await channel.delete("Restoring backup");
            } catch (error) {
              console.error(`Error while deleting channel: ${channel.name}`, error);
            }
          }, index * deletionInterval);
          index++;
        }

        await new Promise((resolve) => setTimeout(resolve, index * deletionInterval));

        let channelsToCreateCount = 0;
        if (Array.isArray(backupDataObj.categories)) {
          for (const categoryData of backupDataObj.categories) {
            channelsToCreateCount += categoryData?.channels?.length || 0;
          }
        }
        const rolesToCreate = Array.isArray(backupDataObj.roles)
          ? backupDataObj.roles.length
          : 0;

        await interaction.editReply(
          `سيتم استعادة **${channelsToCreateCount}** قناة و **${rolesToCreate}** رول.`
        );

        if (Array.isArray(backupDataObj.categories)) {
          for (const categoryData of backupDataObj.categories) {
            let recreatedCategory = null;
            try {
              recreatedCategory = await message.guild.channels.create({
                name: categoryData.name || "Category",
                type: ChannelType.GuildCategory,
                permissionOverwrites: categoryData.permissions || [],
              });
            } catch (error) {
              console.error(
                `Error while recreating category: ${categoryData?.name}`,
                error
              );
              continue;
            }

            if (Array.isArray(categoryData.channels)) {
              for (const channelData of categoryData.channels) {
                try {
                  const chType = mapChannelType(channelData.type);
                  await message.guild.channels.create({
                    name: channelData.name || "channel",
                    type: chType,
                    parent: recreatedCategory.id,
                    permissionOverwrites: channelData.permissions || [],
                    topic: channelData.topic || null,
                    nsfw: Boolean(channelData.nsfw),
                    rateLimitPerUser:
                      typeof channelData.rateLimitPerUser === "number"
                        ? channelData.rateLimitPerUser
                        : undefined,
                  });
                } catch (error) {
                  console.error(
                    `Error while recreating channel: ${channelData?.name}`,
                    error
                  );
                }
              }
            }
          }
        }

        if (Array.isArray(backupDataObj.roles)) {
          for (const roleData of backupDataObj.roles) {
            try {
              await message.guild.roles.create({
                name: roleData.name || "role",
                color: roleData.color ?? undefined,
                hoist: Boolean(roleData.hoist),
                mentionable: Boolean(roleData.mentionable),
                permissions: roleData.permissions ?? [],
                reason: "Restoring backup",
              });
            } catch (error) {
              console.error(
                `Error while recreating role: ${roleData?.name}`,
                error
              );
            }
          }
        }

        await interaction.editReply("✅ تم استعادة النسخة الاحتياطية بنجاح.");
      } catch (error) {
        console.error("An error occurred while restoring the backup:", error);
        await interaction.editReply(
          "❌ حدث خطأ أثناء استعادة النسخة الاحتياطية."
        );
      }

      collector.stop("done");
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time" && promptMsg.editable) {
        try {
          await promptMsg.edit({
            content: "⏰ انتهى الوقت المحدد.",
            components: [],
          });
        } catch {}
      }
    });
  },
};
