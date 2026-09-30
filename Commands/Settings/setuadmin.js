const Pro = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "setuadmin",
  aliases: ["setuadmin"],
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) {
      return message.reply("ليس لديك الصلاحية لاستخدام هذا الأمر.");
    }

    const action = args[0]; 
    if (action === "enable") {
      await Pro.set(`check_admin_enabled_${message.guild.id}`, true);
      await Pro.set(`check_unmute_enabled_${message.guild.id}`, true);
      await Pro.set(`check_untime_enabled_${message.guild.id}`, true);
      await Pro.set(`check_unprison_enabled_${message.guild.id}`, true);
      return message.channel.send(":white_check_mark: تم تفعيل نظام العقوبات .");
    } else if (action === "disable") {
      await Pro.set(`check_admin_enabled_${message.guild.id}`, false);
      await Pro.set(`check_unmute_enabled_${message.guild.id}`, false);
      await Pro.set(`check_untime_enabled_${message.guild.id}`, false);
      await Pro.set(`check_unprison_enabled_${message.guild.id}`, false);
      return message.channel.send(":x: تم تعطيل نظام العقوبات.");
    } else {
      return message.reply("يرجى تحديد إجراء صحيح: `enable` لتفعيل الأنظمة أو `disable` لتعطيلها.");
    }
  },
};
