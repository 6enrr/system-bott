let config = require("../../config.json");
const { prefix, owners } = require(`${process.cwd()}/config`);
const fs = require("fs");
const db = require("pro.db");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "setowner",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = db.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    if (!args[0] || isNaN(args[0])) {
      const mentions = message.mentions.users;
      if (mentions.size > 0) {
        mentions.forEach((u) => {
          if (!config.owners.includes(u.id)) config.owners.push(u.id);
        });
        fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => err && console.log(err));
        return message.react("☑️");
      }

      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n setowner <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    const id = args[0];
    if (config.owners.includes(id)) return message.reply("**موجود من قبل ..**");

    config.owners.push(id);
    fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => err && console.log(err));
    message.react("✅");
  },
};
