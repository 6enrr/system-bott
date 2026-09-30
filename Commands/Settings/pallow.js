const Pro = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "pallow",
  description: "Enable a user to unpunish any member.",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const memberId = args[0];
    if (!memberId || !message.guild.members.cache.has(memberId)) {
      return message.reply("يرجى ذكر ID العضو الذي تريد منحه الصلاحية.");
    }

    await Pro.push(`allowed_unpunish_${message.guild.id}`, memberId);
    message.channel.send(`:white_check_mark: تم منح الصلاحية لرفع العقوبة للعضو <@${memberId}>.`);
  },
};
