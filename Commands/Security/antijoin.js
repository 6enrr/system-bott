const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  name: "antijoin",
  description: "تفعيل أو تعطيل منع دخول الحسابات الوهمية",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const option = (args[0] || "").toLowerCase();
    if (!["on", "off"].includes(option))
      return message.reply("مثال: antijoin on/off");

    await db.set(`antijoinEnabled_${message.guild.id}`, option === "on");
    const embed = new EmbedBuilder()
      .setColor(option === "on" ? Colors.Green : Colors.Red)
      .setDescription(
        `تم ${option === "on" ? "تفعيل" : "تعطيل"} وضع منع دخول الحسابات الوهمية`
      );
    message.reply({ embeds: [embed] });
  },
};
