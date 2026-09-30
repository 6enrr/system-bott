const { EmbedBuilder } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Data = require("pro.db");

module.exports = {
  name: "removealias",
  aliases: ["removeshortcut"],
  run: async function (client, message) {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    const [, commandName, aliasName] = message.content.split(" ");
    const command = client.commands.get(commandName);

    if (!command) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n removealias ban حظر**`);
      return message.reply({ embeds: [embed] });
    }

    if (!command.aliases.includes(aliasName)) return message.reply("**الاختصار غير موجود بالفعل.**");

    const idx = command.aliases.indexOf(aliasName);
    command.aliases.splice(idx, 1);
    Data.set(`aliases_${command.name}`, command.aliases);

    message.react("✅");
  },
};
