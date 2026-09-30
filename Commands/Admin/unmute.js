const { EmbedBuilder } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");
const moment = require("moment");

module.exports = {
  name: "unmute",
  aliases: ["تكلم"],
  description: "A command to unmute a member.",
  run: async (client, message, args) => {
    const Color =
      Pro.get(`Guild_Color_${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#000000";

    const roleId = Pro.get(`Allow_Command_unmute_${message.guild.id}`);
    const allowedRole = message.guild.roles.cache.get(roleId);
    const isAuthorAllowed = allowedRole
      ? message.member.roles.cache.has(allowedRole.id)
      : false;

    const allowList =
      Pro.get(`allowed_unpunish_${message.guild.id}`) || [];
    const isAllowedMember = allowList.includes(message.author.id);

    if (
      !isAuthorAllowed &&
      !isAllowedMember &&
      !message.member.permissions.has("MuteMembers")
    ) {
      return message.reply("❌ - **You do not have permission to unmute members.**");
    }

    let member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(Color || "#5c5e64")
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة .\n تكلم <@${message.author.id}>**`
        );
      return message.reply({ embeds: [embed] });
    }

    const prisonData = Pro.get(`Muted_Member_${member.id}`);
    const prisonReason = prisonData
      ? prisonData.reason
      : "سبب الاسكات غير معروف";

    const isMuteSystemEnabled = Pro.get(
      `check_unmute_enabled_${message.guild.id}`
    );

    if (isMuteSystemEnabled) {
      const lastMuteAuthor = Pro.get(`Muted_By_${member.id}`);
      if (
        lastMuteAuthor &&
        lastMuteAuthor !== message.author.id &&
        !isAllowedMember
      ) {
        return message.reply(
          "❌ - **You cannot unmute this member because you did not mute them.**"
        );
      }
    }

    let role = member.guild.roles.cache.find((r) => r.name === "Muted");
    if (!role) return message.react("❎");

    if (!member.roles.cache.has(role.id)) {
      return message.reply("**This member is not muted.**");
    }

    try {
      await member.roles.remove(role);
      Pro.add(`unmutepp_${message.author.id}`, 1);
      message.react("✅");

      const logChannelId = Pro.get(
        `logtmuteuntmute_${message.guild.id}`
      );
      const logChannel =
        message.guild.channels.cache.get(logChannelId);

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setAuthor({
            name: member.user.tag,
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setColor("#f5f5ff")
          .setDescription(
            `**فك الآسكات الكتابي\n\nالعضو : ${member}\nبواسطة : ${message.author}\n[Message](${message.url})\nفّك فيـ : ${moment().format(
              "HH:mm"
            )}\nMute : ${prisonReason}**`
          )
          .setThumbnail(
            "https://cdn.discordapp.com/attachments/1091536665912299530/1153875266066710598/image_1.png"
          )
          .setFooter({
            text: message.author.tag,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          });

        await logChannel.send({ embeds: [logEmbed] });
      }

      if (Pro.has(`Muted_Member_${member.id}`)) {
        Pro.delete(`Muted_Member_${member.id}`);
        if (Pro.has(`mute_${member.id}`)) {
          Pro.delete(`mute_${member.id}`);
        }
      }
    } catch (err) {
      console.error("An error occurred while unmuting the member:", err);
      message.reply("An error occurred while trying to unmute the member.");
    }
  },
};
