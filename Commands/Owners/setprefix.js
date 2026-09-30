const { EmbedBuilder } = require("discord.js");
let config = require("../../config.json");
const { owners } = require(`${process.cwd()}/config`);
const fs = require("fs");
const Data = require("pro.db");

module.exports = {
  name: "setprefix",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    if (!args[0]) {
      const reply = await message.reply(`**بادئة البوت الحالية: \`${config.prefix}\`**`);
      setTimeout(() => reply.edit("**يرجى إدخال البادئة الجديدة.**"), 5000);
      return;
    }

    config.prefix = args[0];
    fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
      if (err) console.log(err);
    });

    const embed = new EmbedBuilder()
      .setColor("#5c5e64")
      .setDescription(`**تم تعيين البادئة إلى \`${args[0]}\` بنجاح.**`);
    message.reply({ embeds: [embed] });
  },
};
