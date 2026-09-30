const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  name: "antidelete",
  description: "منع حذف الرولات أو الرومات",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const option = (args[0] || "").toLowerCase();

    if (!["on", "off"].includes(option))
      return message.reply("مثال: antidelete on/off");

    await db.set(`antiDelete_${message.guild.id}`, option === "on");
    const embed = new EmbedBuilder()
      .setColor(option === "on" ? Colors.Green : Colors.Red)
      .setDescription(
        `تم ${option === "on" ? "تفعيل" : "تعطيل"} مانع حذف الرولات والرومات`
      );
    message.channel.send({ embeds: [embed] });
  },
};
