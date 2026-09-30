const {
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "lastvoice",
  aliases: ["lv"],
  run: async (client, message, args) => {
    const disabled = db.get(`command_enabled_lastvoice`);
    if (disabled === false) return;

    const allowId = db.get(
      `Allow - Command lastvoice = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowId);
    const canUse =
      message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      ) ||
      message.member.roles.cache.has(allowRole?.id) ||
      message.author.id === allowId;
    if (!canUse) return message.react("❌").catch(() => {});

    const count = Math.min(parseInt(args[0]) || 5, 10);

    const voiceChs = message.guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildVoice
    );

    if (!voiceChs.size)
      return message.reply("مافي رومات صوتية.");

    const users = new Map();

    voiceChs.forEach((ch) => {
      ch.members
        .filter((m) => !m.user.bot)
        .forEach((m) => {
          if (!users.has(m.id)) {
            users.set(m.id, {
              user: m.user,
              channel: ch.name,
            });
          }
        });
    });

    const arr = [...users.values()].slice(0, count);
    if (!arr.length)
      return message.reply("مافي أحد داخل صوت.");

    const emb = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle(`آخر ${arr.length} دخلوا الصوت`)
      .setDescription(
        arr
          .map(
            (d, i) =>
              `**${i + 1}. ${d.user}** — قناة: **${d.channel}**`
          )
          .join("\n")
      );

    message.channel.send({ embeds: [emb] });
  },
};
