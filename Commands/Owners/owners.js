let config = require("../../config.json");
const { owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "owners",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = db.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    const ownerList =
      config.owners.length > 0
        ? config.owners
            .filter((id) => id.trim() !== "")
            .map((id, i) => ` \`#${i + 1}\` <@${id}>`)
            .join("\n")
        : "لا يوجد أونر مضاف حاليًا.";

    const embed = new EmbedBuilder()
      .setColor(Color)
      .setDescription(ownerList)
      .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    return message.reply({ embeds: [embed] });
  },
};
