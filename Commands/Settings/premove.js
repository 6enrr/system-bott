const Pro = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "premove",
  description: "Remove a user's permission to unpunish any member.",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const memberId = args[0];
    if (!memberId || !message.guild.members.cache.has(memberId)) {
      return message.reply("يرجى ذكر ID العضو الذي تريد إزالة الصلاحية عنه.");
    }

    const allowedMembers = Pro.get(`allowed_unpunish_${message.guild.id}`) || [];
    const updatedMembers = allowedMembers.filter((id) => id !== memberId);
    await Pro.set(`allowed_unpunish_${message.guild.id}`, updatedMembers);

    message.channel.send(`:x: تم إزالة صلاحية رفع العقوبة من العضو <@${memberId}>.`);
  },
};
