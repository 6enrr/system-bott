const { EmbedBuilder, Colors } = require("discord.js");
const Pro = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "plist",
  description: "عرض قائمة الأشخاص الذين يمتلكون صلاحية فك أي عقوبة.",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const allowedMembers = Pro.get(`allowed_unpunish_${message.guild.id}`) || [];
    if (allowedMembers.length === 0) {
      return message.reply("لا يوجد أعضاء لديهم صلاحية فك العقوبات.");
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.DarkButNotBlack)
      .setTitle("عرض قائمة الأشخاص الذين يمتلكون صلاحية فك أي عقوبة")
      .setDescription(allowedMembers.map((id) => `<@${id}>`).join("\n"))
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
