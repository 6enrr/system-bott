const { EmbedBuilder, Colors } = require("discord.js");
const Data = require("pro.db");

module.exports = {
  name: "claim",
  aliases: ["استلام"],
  description: "استلام التذكرة (Claim)",
  run: async (client, message) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;
    if (!message.guild) return;

    try {
      const roleId = Data.get(`Role = [${message.guild.id}]`);
      if (!roleId || !message.member.roles.cache.has(roleId)) return;

      const Color =
        Data.get(`Guild_Color = ${message.guild.id}`) ||
        message.guild.members.me?.displayHexColor ||
        Colors.Blurple;

      const ticketOwnerId = Data.get(`channel${message.channel.id}`);
      if (!ticketOwnerId) return message.react("❌");

      const claimKey = `claim${message.channel.id}`;
      const alreadyClaimed = Data.get(claimKey);

      if (alreadyClaimed && alreadyClaimed === message.author.id)
        return message.reply("**أنت بالفعل مستلم هذه التذكرة. ✅**");

      if (alreadyClaimed && alreadyClaimed !== message.author.id)
        return message.reply("**التذكرة مستلمة بالفعل من موظف آخر. ❌**");

      Data.set(claimKey, message.author.id);

      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**تم استلام هذه التذكرة بواسطة : <@${message.author.id}> ✅**`
        );

      await message.reply({ embeds: [embed] });
    } catch (e) {
      console.error("claim error:", e);
    }
  },
};
