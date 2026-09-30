const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  name: "antispam",
  description: "تشغيل أو إيقاف مانع السبام",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const state = (args[0] || "").toLowerCase();
    if (!["on", "off"].includes(state))
      return message.reply("مثال: antispam on/off");

    await db.set(`spamProtectionEnabled_${message.guild.id}`, state === "on");
    const embed = new EmbedBuilder()
      .setColor(state === "on" ? Colors.Green : Colors.Red)
      .setDescription(
        `تم ${state === "on" ? "تفعيل" : "تعطيل"} مانع الاسبام`
      );
    message.reply({ embeds: [embed] });
  },
};
