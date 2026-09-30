const { EmbedBuilder, Colors } = require("discord.js");
const Data = require("pro.db");

module.exports = {
  name: "task",
  description: "عرض المهام الإدارية",
  run: async (client, message) => {
    const tasks = Data.get(`tasks_${message.guild.id}`) || [];
    if (tasks.length === 0) return message.reply("لا توجد مهام إدارية محددة في هذا السيرفر.");

    const embed = new EmbedBuilder()
      .setTitle("المهام الإدارية")
      .setDescription(tasks.map((t, i) => `${i + 1}. ${t}`).join("\n"))
      .setColor(Colors.Blurple);

    return message.reply({ embeds: [embed] });
  },
};
