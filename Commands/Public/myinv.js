const db = require("pro.db");
const { inviteTracker } = require("discord-inviter");

module.exports = {
  name: "myinv",
  aliases: ["دعواتي", "invites"],
  run: async (client, message) => {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const setChannel = db.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    const user =
      message.mentions.members.first() ||
      message.guild.members.cache.get(message.content.split(" ")[1]) ||
      message.member;

    let invite = { count: 0 };
    try {
      invite = await inviteTracker.getMemberInvites(user);
    } catch (e) {
      invite = { count: 0 };
    }

    message.reply(`**${user} : ${invite.count}**`);
  },
};
