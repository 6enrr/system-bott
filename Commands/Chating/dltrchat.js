const d8b = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "dltrchat",
  description: "حذف إعداد شات التقييمات المحفوظ",
  usage: "!delete-set-channel",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = d8b.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const evaluationChannelID = d8b.get(`setevaluation_${message.guild.id}`);
    if (evaluationChannelID) {
      d8b.delete(`setevaluation_${message.guild.id}`);
      return message.react("✅");
    } else {
      return message.reply("**لا يوجد شات تقييمات محفوظ إلي الآن**.");
    }
  },
};
