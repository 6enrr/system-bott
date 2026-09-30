const { EmbedBuilder } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "unprison",
  aliases: ["عفو"],
  run: async (client, message, args) => {
    const isEnabled = Pro.get(
      `command_enabled_${module.exports.name}`
    );
    if (isEnabled === false) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) || "#5c5e64";

    const dbVal = Pro.get(
      `Allow - Command unprison = [ ${message.guild.id} ]`
    );
    const allowedRole = message.guild.roles.cache.get(dbVal);
    const isAuthorAllowed = message.member.roles.cache.has(
      allowedRole?.id
    );

    const allowList =
      Pro.get(`allowed_unpunish_${message.guild.id}`) || [];
    const isAllowedMember = allowList.includes(message.author.id);

    if (
      !isAuthorAllowed &&
      !isAllowedMember &&
      message.author.id !== dbVal &&
      !message.member.permissions.has("MuteMembers")
    ) {
      return;
    }

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة .\n عفو <@${message.author.id}>**`
        );
      return message.reply({ embeds: [embed] });
    }

    const prisonRole = member.guild.roles.cache.find(
      (r) => r.name === "prison"
    );
    const prisonData = Pro.get(`prison_${member.id}`);

    if (!prisonRole || !prisonData) {
      return message.reply(`**${member} ليس مسجونًا!**`);
    }

    const isUnprisonEnabled = Pro.get(
      `check_unprison_enabled_${message.guild.id}`
    );
    if (isUnprisonEnabled) {
      const lastPrisoner = prisonData.by;
      if (lastPrisoner !== message.author.id && !isAllowedMember) {
        return message.reply(
          "❌ - **لا يمكنك فك سجن هذا العضو لأنك لم تقم بإعطائه.**"
        );
      }
    }

    await member.roles.remove(prisonRole).catch(() => {});
    message.react("✅");
    Pro.add(`unprisonpp_${message.author.id}`, 1);

    let logChannel = Pro.get(
      `logprisonunprison_${message.guild.id}`
    );
    logChannel = message.guild.channels.cache.get(logChannel);

    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setAuthor({
          name: member.user.tag,
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setColor("#5c5e64")
        .setDescription(
          `**فك سجن\n\nالعضو : ${member}\nبواسطة : ${message.author}\n[Message](${message.url})**\n\`\`\`Prison : ${
            prisonData.reason || "سبب السجن غير معروف"
          }\`\`\` `
        )
        .setThumbnail("https://b.top4top.io/p_3087ni77r1.png")
        .setFooter({
          text: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        });

      await logChannel.send({ embeds: [logEmbed] });
    }

    Pro.delete(`prison_${member.id}`);
  },
};
