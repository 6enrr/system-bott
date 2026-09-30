const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  name: "antiwebhook",
  description: "منع إنشاء Webhook غير مصرح",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const state = (args[0] || "").toLowerCase();
    if (!["on", "off"].includes(state))
      return message.reply("مثال: antiwebhook on/off");

    await db.set(`antiWebhook_${message.guild.id}`, state === "on");
    const embed = new EmbedBuilder()
      .setColor(state === "on" ? Colors.Green : Colors.Red)
      .setDescription(
        `تم ${state === "on" ? "تفعيل" : "تعطيل"} مانع إنشاء Webhook`
      );
    message.channel.send({ embeds: [embed] });
  },
};
