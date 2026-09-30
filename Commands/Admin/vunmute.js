const { EmbedBuilder } = require("discord.js");
const db = require("pro.db");
const Pro = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "vunmute",
  aliases: ["فك", "unvmute"],
  run: async (client, message, args) => {
    try {
      const featureEnabled = db.get(
        `muteFeatureEnabled_${message.guild.id}`
      );
      const isEnabled = db.get(
        `command_enabled_${module.exports.name}`
      );
      if (isEnabled === false) return;

      const Color =
        db.get(`Guild_Color_${message.guild.id}`) || "#5c5e64";

      const allowedRoleId = Pro.get(
        `Allow_Command_vmute_${message.guild.id}`
      );
      const allowedRole = message.guild.roles.cache.get(allowedRoleId);
      const isAuthorAllowed =
        message.member.roles.cache.has(allowedRole?.id) || false;

      const membercheck = await message.guild.members.fetch(
        message.author.id
      );
      const rolesArray = [...membercheck.roles.cache.values()];
      let state = false;
      for (const role of rolesArray) {
        const check_data = Pro.get(
          `permissions_${message.guild.id}_${role.id}`
        );
        if (
          check_data &&
          check_data.length > 0 &&
          check_data.includes("vmute")
        ) {
          state = true;
          break;
        }
      }

      const member =
        message.mentions.members.first() ||
        message.guild.members.cache.get(args[0]);

      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(Color)
          .setDescription(
            `**يرجى استعمال الأمر بالطريقة الصحيحة.\n فك <@${message.author.id}>**`
          );
        return message.reply({ embeds: [embed] });
      }

      if (!member.voice.channel) {
        return message.reply({
          content: `**المستخدم ليس في قناة صوتية.**`,
        });
      }

      const muteData = db.get(`voicemute_${member.id}`);
      if (!muteData) {
        return message.reply({
          content: `**العضو ليس لديه ميوت مفعل.**`,
        });
      }

      if (featureEnabled) {
        if (muteData.by !== message.author.id) {
          return message.reply(
            "**لا يمكنك فك الميوت لأنك لم تكن من قام بتطبيقه.**"
          );
        }
      } else {
        if (
          !isAuthorAllowed &&
          !state &&
          !message.member.permissions.has("MuteMembers")
        ) {
          return message.reply({
            content: `**ليس لديك الصلاحيات الكافية لفك الميوت.**`,
          });
        }
      }

      if (db.has(`voicemute_${member.id}`)) {
        await db.delete(`voicemute_${member.id}`);
      }

      await member.voice.setMute(false);
      message.reply({
        content: `**تم فك الميوت عن ${member.user.username}.**`,
      });
      db.add(`Total_voice_${member.id}`, 1);

      const logEmbed = new EmbedBuilder()
        .setColor(Color)
        .setAuthor({
          name: member.user.tag,
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(
          `**فك الميوت \n\nالعضو : <@${member.id}>\nبواسطة : <@${message.author.id}>**`
        )
        .setThumbnail(
          `https://l.top4top.io/p_30871ktpe1.png`
        )
        .setTimestamp();

      const logChannelId = db.get(
        `logtvoicemute_${message.guild.id}`
      );
      const logChannel = message.guild.channels.cache.get(logChannelId);

      if (logChannel) {
        logChannel.send({ embeds: [logEmbed] });
      }
    } catch (err) {
      console.error("Error in vunmute command:", err);
      message.reply({ content: `حدث خطأ أثناء تنفيذ الأمر.` });
    }
  },
};
