const {
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "vkick",
  run: async (client, message, args) => {
    const enabled = Pro.get(`command_enabled_vkick`);
    if (enabled === false) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";

    const allowId = Pro.get(
      `Allow - Command vkick = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowId);

    const canUse =
      message.member.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      ) ||
      message.member.roles.cache.has(allowRole?.id) ||
      message.author.id === allowId;

    if (!canUse) return message.react("❌").catch(() => {});

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!member) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Color)
            .setDescription(
              `استعمل:\n vkick @عضو`
            ),
        ],
      });
    }

    if (!member.voice.channel)
      return message.reply("العضو مو في روم صوتي.");

    if (
      message.member.roles.highest.position <=
      member.roles.highest.position
    ) {
      return message.reply(
        "ما تقدر تطرده لأنه أعلى/نفس رتبتك."
      );
    }

    try {
      await member.voice.disconnect();
      message.reply(
        `✅ تم طرد ${member.user.username} من الصوت`
      );
    } catch (e) {
      message.reply("ما قدرت أطرده.");
    }
  },
};
