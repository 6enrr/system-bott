const { EmbedBuilder } = require("discord.js");
const Pro = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "untimeout",
  aliases: ["untimeout"],
  run: async (client, message, args) => {
    const Color =
      Pro.get(`Guild_Color_${message.guild.id}`) || "#f5f5ff";

    const dbVal = Pro.get(
      `Allow_Command_untimeout_${message.guild.id}`
    );
    const allowedRole = message.guild.roles.cache.get(dbVal);
    const isAuthorAllowed = message.member.roles.cache.has(
      allowedRole?.id
    );

    const allowList =
      Pro.get(`allowed_unpunish_${message.guild.id}`) || [];
    const isAllowedMember = allowList.includes(message.author.id);

    const hasManageChannels = message.member.permissions.has(
      "ManageChannels"
    );

    if (!hasManageChannels && !isAuthorAllowed && !isAllowedMember) {
      return message.reply("**ليس لديك الإذن لاستخدام هذا الأمر.**");
    }

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor("#ff4444")
        .setTitle("خطأ في استخدام الأمر")
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة:**\n\` untimeout <@user>\``
        )
        .setFooter({ text: "يرجى ذكر العضو بشكل صحيح." });

      return message.reply({ embeds: [embed] });
    }

    const timeoutData = Pro.get(
      `timeout_${member.id}_${message.guild.id}`
    );
    if (!timeoutData) {
      const embed = new EmbedBuilder()
        .setColor("#ff4444")
        .setTitle("خطأ")
        .setDescription(`**هذا العضو ليس في حالة تايم أوت.**`)
        .setFooter({
          text: "يمكنك التحقق من حالة التايم أوت الخاصة بالعضو.",
        });

      return message.reply({ embeds: [embed] });
    }

    const isTimeoutEnabled = Pro.get(
      `check_untime_enabled_${message.guild.id}`
    );

    if (isTimeoutEnabled) {
      const timeoutBy = timeoutData.by;
      if (timeoutBy !== message.author.id && !isAllowedMember) {
        return message.reply(
          "❌ - **لا يمكنك إلغاء التايم أوت لهذا العضو لأنك لم تقم بإعطائه.**"
        );
      }
    }

    const logChannelId = Pro.get(
      `logtimeuntime_${message.guild.id}`
    );

    member
      .timeout(null)
      .then(async () => {
        Pro.delete(`timeout_${member.id}_${message.guild.id}`);
        message.reply(
          `**تم الغاء التايم أوت للعضو <@${member.id}> بنجاح.**`
        );

        const logChannel =
          message.guild.channels.cache.get(logChannelId);

        if (logChannel) {
          const embedLog = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle("Timeout Removed")
            .setDescription(
              `**تم الغاء التايم أوت**\n\n**العضو:** <@${member.id}>\n**بواسطة:** <@${message.author.id}>`
            )
            .setFooter({
              text: message.guild.name,
              iconURL: message.guild.iconURL({ dynamic: true }),
            })
            .setTimestamp()
            .setThumbnail(
              "https://cdn.discordapp.com/attachments/1325773226835705919/1325774755894136863/whistle.png"
            );

          await logChannel.send({ embeds: [embedLog] });
        }
      })
      .catch((err) => {
        console.log(
          `فشل في الغاء التايم أوت للعضو: ${err.message}`
        );
        message.reply({
          content: `**حدث خطأ أثناء محاولة إلغاء التايم أوت.**`,
        });
      });
  },
};
