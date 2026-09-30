const { EmbedBuilder } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");
const ms = require("ms");
const moment = require("moment");

module.exports = {
  name: "timeout",
  aliases: ["تايم"],
  run: async (client, message, args) => {
    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";

    const dbVal = Pro.get(
      `Allow - Command timeout = [ ${message.guild.id} ]`
    );
    const allowedRole = message.guild.roles.cache.get(dbVal);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === dbVal ||
      message.member.permissions.has("MuteMembers");

    if (!isAuthorAllowed) return;

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة .\n تايم <@${message.author.id}> 1h**`
        );
      return message.reply({ embeds: [embed] });
    }

    if (!member) {
      return message
        .reply({
          content: `**لا يمكنني اعطاء ميوت لهاذا العضو .**`,
        })
        .catch(console.error);
    }

    if (member.id === message.author.id) {
      return message
        .reply({
          content: `**لا يمكنك اعطاء ميوت لنفسك .**`,
        })
        .catch(console.error);
    }

    if (member.permissions.has("Administrator")) {
      return message
        .reply({
          content: `**لا يمكنك اعطاء تايم أوت لأدمن ${member.user.username}**`,
        })
        .catch(console.error);
    }

    if (
      message.member.roles.highest.position <
      member.roles.highest.position
    ) {
      return message.reply({
        content:
          ":rolling_eyes: **You can't timeout هذا الشخص لأنه أعلى منك**",
      });
    }

    if (!args[1]) {
      return message.reply({
        content: `**يرجي تحديد وقت التايم أوت.**`,
      });
    }

    if (
      !/[smhdw]$/.test(args[1])
    ) {
      return message.reply({
        content:
          "** يجب أن ينتهي الوقت بـ .** `s / m / h / d / w` ",
      });
    }

    message.reply(
      `**تم أعطاء تايم أوت للعضو <@${member.id}> بنجاح.**`
    );

    const timeoutDuration = ms(args[1]);
    const timeoutMessage = `Timed out for ${args[1]}.`;

    await member
      .timeout(timeoutDuration, timeoutMessage)
      .then(() => {
        const timeoutData = {
          duration: timeoutDuration,
          reason: timeoutMessage,
          endsAt: Date.now() + timeoutDuration,
          by: message.author.id,
        };

        const existingTimeouts =
          Pro.get(`Timeout_Members_${member.id}`) || [];
        existingTimeouts.push(timeoutData);

        Pro.set(`Timeout_Members_${member.id}`, existingTimeouts);
        Pro.set(
          `timeout_${member.id}_${message.guild.id}`,
          timeoutData
        );

        const logChannelId = Pro.get(
          `logtimeuntime_${message.guild.id}`
        );
        const logChannel =
          message.guild.channels.cache.get(logChannelId);

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setAuthor({
              name: member.user.tag,
              iconURL: member.user.displayAvatarURL({
                dynamic: true,
              }),
            })
            .setDescription(
              `**تايم أوت\n\nالعضو : <@${member.user.id}>\nبواسطة : <@${message.member.id}>\nفيـ : [Message](${message.url})\nالوقت : ${args[1]}\nاعطى فيـ : ${moment().format(
                "HH:mm"
              )}**\n\`\`\`Reason : No reason\`\`\`\ `
            )
            .setColor(`#312e5d`)
            .setFooter({
              text: message.author.tag,
              iconURL: message.author.displayAvatarURL({
                dynamic: true,
              }),
            })
            .setThumbnail(
              `https://cdn.discordapp.com/attachments/1325773226835705919/1325774437320097802/deadline.png`
            );

          logChannel.send({ embeds: [logEmbed] });
        }

        member
          .send(
            `تم أعطاء تايم أوت لك بنجاح لمدة ${args[1]} من قبل <@${message.member.id}>.`
          )
          .catch(() => {});
      })
      .catch((err) => {
        console.log(`Failed to timeout member: ${err.message}`);
      });
  },
};
