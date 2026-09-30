const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  name: "servername",
  description: "تفعيل أو تعطيل حماية اسم السيرفر",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const state = (args[0] || "").toLowerCase();
    if (!["on", "off"].includes(state))
      return message.reply("مثال: servername on/off");

    await db.set(`antiServerName_${message.guild.id}`, state === "on");
    const embed = new EmbedBuilder()
      .setColor(state === "on" ? Colors.Green : Colors.Red)
      .setDescription(
        `تم ${state === "on" ? "تفعيل" : "تعطيل"} حماية تغيير اسم السيرفر`
      );
    message.channel.send({ embeds: [embed] });
  },
};
