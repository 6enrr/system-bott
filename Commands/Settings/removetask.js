const { EmbedBuilder, PermissionsBitField, Colors } = require("discord.js");
const Data = require("pro.db");

module.exports = {
  name: "removetask",
  description: "إزالة مهمة إدارية",
  run: async (client, message, args) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("لا تملك الصلاحيات المطلوبة لإزالة المهام.");

    const taskInput = args.join(" ");
    if (!taskInput?.trim()) return message.reply("يرجى إدخال المهمة التي تريد إزالتها. مثل: /removetask تنظيف القاعات");

    let tasks = Data.get(`tasks_${message.guild.id}`) || [];
    if (tasks.length === 0) return message.reply("لا توجد مهام محددة حتى الآن.");

    let removedTask = null;
    if (!isNaN(taskInput)) {
      const index = parseInt(taskInput) - 1;
      if (index < 0 || index >= tasks.length) return message.reply("الرقم المقدم غير صحيح أو خارج النطاق.");
      removedTask = tasks.splice(index, 1)[0];
    } else {
      const target = taskInput.toLowerCase();
      const index = tasks.findIndex((t) => t.toLowerCase() === target);
      if (index === -1) return message.reply("المهمة المحددة غير موجودة.");
      removedTask = tasks.splice(index, 1)[0];
    }

    Data.set(`tasks_${message.guild.id}`, tasks);

    const embed = new EmbedBuilder()
      .setTitle("المهام الإدارية")
      .setDescription(`**تم إزالة المهمة: ${removedTask}**\n\nالمهام المتبقية:`)
      .setColor(Colors.Green);

    if (tasks.length > 0) {
      const taskList = tasks.map((t, i) => `${i + 1}. ${t}`).join("\n");
      embed.addFields({ name: "قائمة المهام", value: taskList });
    } else {
      embed.setDescription(`**تم إزالة المهمة: ${removedTask}**\n\nلا توجد مهام متبقية.`);
    }

    return message.channel.send({ embeds: [embed] });
  },
};
