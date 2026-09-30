const {
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const Pro = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "moveme",
  aliases: ["ودني"],
  run: async (client, message, args) => {
    const isEnabled = Pro.get(`command_enabled_moveme`);
    if (isEnabled === false) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#000000";

    const allowVal = Pro.get(
      `Allow - Command move = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowVal);
    const canUse =
      message.member.roles.cache.has(allowRole?.id) ||
      message.author.id === allowVal ||
      message.member.permissions.has(
        PermissionsBitField.Flags.MoveMembers
      );

    if (!canUse) return message.react("❌").catch(() => {});

    const target =
      message.mentions.members.first() || message.member;

    const authorVoice = message.member.voice.channel;
    const targetVoice = target.voice.channel;

    if (!authorVoice) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Color)
            .setDescription("لازم تكون أنت في روم صوتي أولاً."),
        ],
      });
    }

    if (!targetVoice) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Color)
            .setDescription(
              `العضو مو في صوت.\nاستعمل:\n ودني @${message.author.username}`
            ),
        ],
      });
    }

    if (authorVoice.id === targetVoice.id) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Color)
            .setDescription("أنتم أصلاً في نفس الروم 😂"),
        ],
      });
    }

    await target.voice.setChannel(authorVoice).catch(() => {
      return message.reply("ما قدرت أنقله.");
    });

    message.react("✅").catch(() => {});

    const logId = Pro.get(`logmove_${message.guild.id}`);
    const logCh = message.guild.channels.cache.get(logId);
    if (logCh) {
      const e = new EmbedBuilder()
        .setColor("#712519")
        .setAuthor({
          name: message.member.displayName,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(
          `**تحريك عضو**\nالمحرك: <@${message.author.id}>\nالعضو المنقول: <@${target.id}>\nمن: <#${targetVoice.id}>\nإلى: <#${authorVoice.id}>`
        );
      logCh.send({ embeds: [e] }).catch(() => {});
    }
  },
};
