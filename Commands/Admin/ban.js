const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

const banCount = new Map();
setInterval(() => banCount.clear(), 24 * 60 * 60 * 1000);

module.exports = {
  name: "ban",
  aliases: ["برا", "شقطحح", "شقطح", "ملحد", "تفه"],
  run: async (client, message) => {
    const Color =
      Pro.get(`Guild_Color_${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#000000";

    const allowedRoleId = Pro.get(
      `Allow_Command_ban_${message.guild.id}`
    );
    const allowedRole = message.guild.roles.cache.get(allowedRoleId);
    const isAuthorAllowed = message.member.roles.cache.has(
      allowedRole?.id
    );

    const banLimit =
      Pro.get(`ban_limit_${message.guild.id}`) || 3;

    if (
      banCount.has(message.author.id) &&
      banCount.get(message.author.id) >= banLimit
    ) {
      return message.reply(
        ":rolling_eyes: - **The ban limit has been exceeded.**"
      );
    }

    if (
      !isAuthorAllowed &&
      message.member.id !== allowedRoleId &&
      !message.member.permissions.has(PermissionsBitField.Flags.BanMembers)
    ) {
      return message.react("❌");
    }

    const args = message.content.trim().split(/\s+/);
    let member;

    if (message.mentions.members.size) {
      member = message.mentions.members.first();
    } else if (args[1] && !isNaN(args[1])) {
      member = await message.guild.members
        .fetch(args[1])
        .catch(() => null);
    } else {
      const dbAliases =
        Pro.get(`aliases_${module.exports.name}`) || [];
      const allAliases = [
        ...new Set([...module.exports.aliases, ...dbAliases]),
      ];
      const aliases = allAliases.join(", ");

      const embed = new EmbedBuilder()
        .setColor(Color)
        .setTitle("Command: ban")
        .setDescription("Bans a member.")
        .addFields(
          {
            name: "Aliases:",
            value: aliases || "لا يوجد.",
          },
          {
            name: "Usage:",
            value: `\` ban [user]\``,
          },
          {
            name: "Examples:",
            value: `\` ban @user\`\n\` ban 123456789012345678\``,
          }
        );
      return message.reply({ embeds: [embed] });
    }

    if (member.id === client.user.id) {
      return message.reply("**🙄 You can't ban a bot.**");
    }

    if (!message.guild.members.me.permissions.has("BanMembers")) {
      return message.reply(
        "**🙄 I do not have permission to ban members.**"
      );
    }

    if (member.permissions?.has("BanMembers")) {
      return message.reply("**🙄 You cannot ban this member.**");
    }

    if (member.id === message.author.id) {
      return message.reply("**🙄 You cannot ban yourself.**");
    }

    const reason = args.slice(2).join(" ") || "No reason provided";

    const bans = await message.guild.bans.fetch();
    if (bans.has(member.id)) {
      return message.reply("**This user is already banned.**");
    }

    try {
      await message.guild.members.ban(member, { reason });
      await message.reply(
        `**:white_check_mark: ${member} banned from the server! :airplane:.**`
      );

      const currentCount = banCount.get(message.author.id) || 0;
      banCount.set(message.author.id, currentCount + 1);

      const logbanunban = Pro.get(
        `logbanunban_${message.guild.id}`
      );
      const logChannel =
        message.guild.channels.cache.get(logbanunban);

      if (logChannel) {
        const bannedMemberAvatar = member.user.displayAvatarURL({
          dynamic: true,
        });
        const embedLog = new EmbedBuilder()
          .setColor("#880013")
          .setAuthor({
            name: member.user.tag,
            iconURL: bannedMemberAvatar,
          })
          .setDescription(
            `**حظر عضو**\n\n**لـ : <@${member.id}>**\n**بواسطة : <@${message.author.id}>**\n\`\`\`سبب : ${reason}\`\`\``
          )
          .setFooter({
            text: message.guild.name,
            iconURL: message.guild.iconURL({ dynamic: true }),
          })
          .setThumbnail(
            "https://cdn.discordapp.com/attachments/1093303174774927511/1138892172574326874/82073587-11BA-4E4B-AC8F-8857CD89282F.png"
          );

        await logChannel.send({ embeds: [embedLog] });
      }

      message.react("✅");
    } catch (err) {
      console.error(err);
      message.reply(
        "**An error occurred while trying to ban the member.**"
      );
    }
  },
};
