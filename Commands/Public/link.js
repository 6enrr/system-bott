const Data = require("pro.db");

module.exports = {
  name: "رابط",
  aliases: ["link"],
  run: async (client, message) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    setTimeout(() => {
      message.delete().catch(() => {});
    }, 10_000);

    const user = message.member;
    const maxUses = 3;
    const maxAge = 60 * 60 * 24;

    try {
      const invite = await message.channel.createInvite({
        maxUses,
        maxAge,
        unique: true,
      });

      await user
        .send(
          `ينتهي الرابط بعد: **يوم**
عدد استخدامات الرابط: **3**

${invite.url}
`
        )
        .catch(() => {
          message.reply("ما قدرت أرسل لك الرابط بالخاص.");
        });

      await message.react("✅");
    } catch (e) {
      console.error(e);
      message.reply("ما قدرت أسوي رابط.");
    }
  },
};
