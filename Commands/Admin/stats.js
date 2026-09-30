const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "stats",
  aliases: ["الاحصائيات"],
  run: async (client, message, args) => {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return message.reply("ما عندك صلاحية.");
    }

    const target =
      message.mentions.users.first() ||
      client.users.cache.get(args[0]) ||
      message.author;

    const muteCount = db.get(`muteto_${target.id}`) || 0;
    const prisonCount = db.get(`mutepri_${target.id}`) || 0;
    const vmuteCount = db.get(`mutevo_${target.id}`) || 0;
    const unprison = db.get(`unprisonpp_${target.id}`) || 0;
    const vunmute = db.get(`unvmutepp_${target.id}`) || 0;
    const unmute = db.get(`unmutepp_${target.id}`) || 0;

    const emb = new EmbedBuilder()
      .setColor("#5c5e64")
      .setAuthor({
        name: target.tag,
        iconURL: target.displayAvatarURL({ dynamic: true }),
      })
      .setTitle("المعلومات")
      .setDescription(
        `**السجن**\nاعطاء: ${prisonCount}\nفك: ${unprison}\n\n**الإسكات**\nاعطاء: ${muteCount}\nفك: ${unmute}\n\n**الميوت**\nاعطاء: ${vmuteCount}\nفك: ${vunmute}`
      );

    message.channel.send({ embeds: [emb] });
  },
};
