const { EmbedBuilder } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const Data = require("pro.db");

module.exports = {
  name: "showaliases",
  aliases: ["aliases", "listaliases", "listlcomnd"],
  run: async function (client, message) {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    const commandsMap = new Map();
    const processed = new Set();

    client.commands.forEach((command) => {
      if (!processed.has(command.name)) {
        const aliases = Data.get(`aliases_${command.name}`);
        if (aliases) {
          if (!commandsMap.has(command.name)) commandsMap.set(command.name, []);
          commandsMap.get(command.name).push(aliases.join(", "));
        }
        processed.add(command.name);
      }
    });

    let out = "";
    commandsMap.forEach((aliases, cmd) => {
      out += `**${cmd}** : \`${aliases.join(", ")}\`\n`;
    });

    const embed = new EmbedBuilder()
      .setDescription(out || "**قائمة الأختصارات فارغة**")
      .setColor(Color)
      .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    message.reply({ embeds: [embed] });
  },
};
