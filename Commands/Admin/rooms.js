const {
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "setnick",
  aliases: ["اسم"],
  run: async (client, message, args) => {
    const color =
      db.get(`Guild_Color = ${message.guild.id}`) ||
      db.get(`Guild_Color_${message.guild.id}`) ||
      "#f5f5ff";

    const disabled = db.get(`command_enabled_setnick`);
    if (disabled === false) return;

    const allowId = db.get(
      `Allow - Command setnick = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowId);

    const canUse =
      message.member.permissions.has(
        PermissionsBitField.Flags.ManageNicknames
      ) ||
      message.member.roles.cache.has(allowRole?.id) ||
      message.author.id === allowId;

    if (!canUse) return message.react("❌").catch(() => {});

    const member = message.mentions.members.first();
    const newNick = args.slice(1).join(" ");

    if (!member) {
      const emb = new EmbedBuilder()
        .setColor(color)
        .setDescription(
          `**استعمل:**\n setnick @شخص الاسم_الجديد`
        );
      return message.reply({ embeds: [emb] });
    }

    try {
      await member.setNickname(newNick || null);
      message.react("✅").catch(() => {});
    } catch (e) {
      message.react("❌").catch(() => {});
    }

    const logId = db.get(`lognickname_${message.guild.id}`);
    const logCh = message.guild.channels.cache.get(logId);
    if (logCh) {
      const e = new EmbedBuilder()
        .setColor("#C88EA7")
        .setAuthor({
          name: member.user.tag,
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(
          `**تم تغيير الاسم**\nالعضو: ${member}\nبواسطة: ${message.author}\nالاسم الجديد: \`${newNick || "تم إزالته"}\``
        );
      logCh.send({ embeds: [e] }).catch(() => {});
    }
  },
};
