const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  name: "anticreate",
  description: "تفعيل أو تعطيل مانع إنشاء الرولات أو الرومات",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const cmd = (args[0] || "").toLowerCase();
    if (!["on", "off"].includes(cmd))
      return message.reply("استخدم: anticreate on/off");

    await db.set(`anticreate_${message.guild.id}`, cmd === "on");

    const embed = new EmbedBuilder()
      .setColor(cmd === "on" ? Colors.Green : Colors.Red)
      .setDescription(
        `تم ${cmd === "on" ? "تفعيل" : "تعطيل"} مانع إنشاء الرولات والرومات`
      );
    message.reply({ embeds: [embed] });
  },
};
