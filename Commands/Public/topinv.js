const { EmbedBuilder } = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "top-invites",
  aliases: ["topinv"],
  run: async (client, message) => {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const setChannel = db.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    const guildColor =
      db.get(`Guild_Color_${message.guild?.id}`) || "#f5f5ff";

    const invites = await message.guild.invites.fetch();
    const uniqueInviters = new Map();

    invites.forEach((invite) => {
      const inviter = invite.inviter;
      if (!inviter) return;
      const totalUses = uniqueInviters.get(inviter.id) || 0;
      uniqueInviters.set(inviter.id, totalUses + (invite.uses || 0));
    });

    const sortedInviters = Array.from(uniqueInviters.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    if (sortedInviters.length === 0) {
      return message.reply("**لا يوجد أي شخص في القائمة.**");
    }

    const embed = new EmbedBuilder().setColor(guildColor);

    let desc = "";
    let index = 1;
    for (const [inviterId, totalUses] of sortedInviters) {
      const member = message.guild.members.cache.get(inviterId);
      if (!member) continue;
      if (totalUses <= 0) continue;
      desc += `**#${index} - <@${member.user.id}> : ${totalUses}**\n`;
      index++;
    }

    if (!desc) return message.reply("**لا يوجد أي شخص في القائمة.**");

    embed.setDescription(desc);
    return message.reply({ embeds: [embed] });
  },
};
