const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: "aemoji",
  aliases: ["اضف-ايموجي"],
  run: async (client, message, args) => {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageEmojisAndStickers
      )
    )
      return message.reply("ما عندك صلاحية.");

    const emoji = args[0];
    if (!emoji)
      return message.reply(
        `استعمل:\n aemoji [رابط الايموجي] [الاسم]`
      );

    const name = args[1] || "emoji";

    try {
      const added = await message.guild.emojis.create({
        attachment: emoji,
        name: name,
      });
      message.reply(`✅ تمت إضافة الإيموجي: ${added}`);
    } catch (err) {
      message.reply("❌ ما قدرت أضيف الايموجي، يمكن الرابط خطأ.");
    }
  },
};
