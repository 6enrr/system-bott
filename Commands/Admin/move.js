const {
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

const cooldowns = new Map(); 

module.exports = {
  name: "move",
  aliases: ["سحب", "تل"],
  run: async (client, message, args) => {
    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#000000";

    const allowedRoleID = Pro.get(`Allow - Command move = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowedRoleID);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === allowedRoleID ||
      message.member.permissions.has(PermissionsBitField.Flags.MoveMembers);

    if (!isAuthorAllowed) {
      return message.reply(
        `**:rolling_eyes: - You don't have permissions to move someone!**`
      );
    }

    if (cooldowns.has(message.author.id)) {
      const cooldownAmount = 10_000;
      const now = Date.now();
      const expirationTime = cooldowns.get(message.author.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(
          `**:timer: - Please wait ${timeLeft.toFixed(
            1
          )} more seconds before using this command again.**`
        );
      }
    }

    const membersToMove = message.mentions.members;
    if (!membersToMove || membersToMove.size === 0) {
      const dbAliases = Pro.get(`aliases_${module.exports.name}`) || [];
      const allAliases = [...new Set([...(module.exports.aliases || []), ...dbAliases])];

      const embed = new EmbedBuilder()
        .setColor(Color)
        .setTitle("Command: move")
        .setDescription("Moves mentioned members to your voice channel.")
        .addFields(
          { name: "Aliases:", value: allAliases.join(", ") || "لا يوجد.", inline: false },
          { name: "Usage:", value: `\` move <@user> [@user2] ...\``, inline: false },
          { name: "Examples:", value: `\` move @user1 @user2\``, inline: false }
        )
        .setFooter({ text: "Please mention the users you want to move." });

      return message.reply({ embeds: [embed] });
    }

    const authorVoiceChannel = message.member.voice.channel;
    if (!authorVoiceChannel) {
      return message.reply(
        `**:rolling_eyes: - You are not connected to a voice channel!**`
      );
    }

    membersToMove.forEach(async (member) => {
      const memberVoiceChannel = member.voice.channel;
      if (!memberVoiceChannel) {
        return message.reply(
          `**:rolling_eyes: - ${member.user.username} is not connected to a voice channel!**`
        );
      }

      if (memberVoiceChannel.id === authorVoiceChannel.id) {
        return message.reply(
          `**:rolling_eyes: - ${member.user.username} is already in your voice channel!**`
        );
      }

      try {
        await member.voice.setChannel(authorVoiceChannel);

        const confirmationEmbed = new EmbedBuilder()
          .setColor(Color)
          .setDescription(
            `✅ **${member.user.username} has been moved to ${authorVoiceChannel.name}!**`
          );
        message.channel.send({ embeds: [confirmationEmbed] });

        const logChannel = message.guild.channels.cache.find(
          (ch) => ch.name === "mod-logs"
        );
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("Member Moved")
            .addFields(
              { name: "Moved By:", value: message.author.tag, inline: true },
              { name: "Moved Member:", value: member.user.tag, inline: true },
              { name: "New Channel:", value: authorVoiceChannel.name, inline: true }
            )
            .setTimestamp();
          logChannel.send({ embeds: [logEmbed] });
        }
      } catch {
        return message.reply(
          `**:x: - I could not move ${member.user.username}. Please check my permissions!**`
        );
      }
    });

    cooldowns.set(message.author.id, Date.now());
    setTimeout(() => cooldowns.delete(message.author.id), 10_000);
  },
};
