const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "clear",
  aliases: ["مسح"],
  run: async (client, message, args) => {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    )
      return message.reply("ما عندك صلاحية.");

    const count = parseInt(args[0]);
    if (!count || count <= 0)
      return message.reply("اكتب عدد الرسائل اللي تبي تمسحها.");

    if (count > 100)
      return message.reply("تقدر تمسح إلى 100 فقط.");

    await message.channel.bulkDelete(count, true);
    const msg = await message.channel.send(
      `✅ تم مسح ${count} رسالة.`
    );
    setTimeout(() => msg.delete().catch(() => {}), 4000);
  },
};
