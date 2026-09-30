const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  name: "antibots",
  description: "تشغيل أو إيقاف مانع دخول البوتات",
  usage: ` antibots <on|off>`,
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const state = (args[0] || "").toLowerCase();
    if (!["on", "off"].includes(state))
      return message.reply(`يرجى استخدام:\n\` antibots on/off\``);

    await db.set(`antibots_${message.guild.id}`, state === "on");

    const embed = new EmbedBuilder()
      .setColor(state === "on" ? Colors.Green : Colors.Red)
      .setDescription(
        `✅ تم **${state === "on" ? "تفعيل" : "تعطيل"}** مانع دخول البوتات`
      );

    return message.reply({ embeds: [embed] });
  },
};
