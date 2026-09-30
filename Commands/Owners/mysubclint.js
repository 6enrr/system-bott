const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: "mysub",
  aliases: ["اشتراك", "my-sub"],
  run: async (client, message) => {
    const Color = db.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    if (message.author.id !== config.owners[0]) return;

    try {
      const remaining = config.subscriptionDuration - Date.now();
      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      const formatted = `${days ? `${days}d ` : ""}${hours ? `${hours}h ` : ""}${minutes ? `${minutes}m ` : ""}${seconds ? `${seconds}s` : ""}`;

      const info = `**إسم الاشتراك : Syestm x1\nايدي الاشتراك : ${config.randomCode}\nمسجل لـ : <@${message.author.id}>\nينتهى بعد : \`${formatted}\`**`;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("الدعم الفني").setURL("https://discord.gg/b2e")
      );

      await message.channel.send({ content: info, components: [row] });
    } catch (e) {
      console.error("mysub error:", e);
      message.reply("حدث خطأ أثناء جلب معلومات الاشتراك.");
    }
  },
};
