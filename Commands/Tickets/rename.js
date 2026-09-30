const Data = require("pro.db");

module.exports = {
  name: "rename",
  description: "يقوم بتغيير اسم التذكرة",
  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    try {
      const roleId = Data.get(`Role = [${message.guild.id}]`);
      if (!roleId || !message.member.roles.cache.has(roleId)) return;

      const newName = args.join(" ");
      if (!newName) return message.reply("**يرجى إرفاق اسم التذكرة**.");

      const hasTicketData = Data.get(`channel${message.channel.id}`);
      if (!hasTicketData) return;

      await message.channel.setName(newName);
      message.react("✅");
    } catch (e) {
      console.error("rename error:", e);
      message.reply("حدث خطأ أثناء معالجة الطلب.");
    }
  },
};
