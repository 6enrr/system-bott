const { PermissionsBitField } = require("discord.js");
const Data = require("pro.db");

module.exports = {
  name: "settask",
  description: "تحديد المهام الإدارية",
  run: async (client, message, args) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("لا تملك الصلاحيات المطلوبة لتحديد المهام.");

    const task = args.join(" ");
    if (!task?.trim()) return message.reply("يرجى إدخال المهمة التي تريد إضافتها. مثل: /settask تنظيف القاعات");
    if (task.length > 200) return message.reply("المهمة طويلة جدا. يرجى إدخال مهمة لا تتجاوز 200 حرف.");

    try {
      const tasks = Data.get(`tasks_${message.guild.id}`) || [];
      if (tasks.includes(task)) return message.reply("هذه المهمة موجودة مسبقا.");

      tasks.push(task);
      Data.set(`tasks_${message.guild.id}`, tasks);
      return message.reply(`تم إضافة المهمة: **${task}**. الآن هناك ${tasks.length} مهام.`);
    } catch (e) {
      console.error(e);
      return message.reply("حدث خطأ أثناء إضافة المهمة. يرجى المحاولة مرة أخرى.");
    }
  },
};
