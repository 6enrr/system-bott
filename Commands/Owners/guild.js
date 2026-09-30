const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
let config = require("../../config.json");
const Data = require("pro.db");
const { prefix, owners } = require(`${process.cwd()}/config`);
const fs = require("fs");

module.exports = {
  name: "guild",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    if (!args[0] || !/^\d{17,19}$/.test(args[0])) {
      const embed = new EmbedBuilder()
        .setColor(Color || message.guild.members.me?.displayHexColor || "#f5f5ff")
        .setDescription(`**يرجى استخدام الأمر بالطريقة الصحيحة.\n guild أيدي السيرفر**`);
      return message.reply({ embeds: [embed] });
    }

    const newGuildId = args[0];

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("إضافة")
        .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`)
    );

    message.author
      .send({ content: "**أضغط على الزر لإضافة البوت**", components: [row] })
      .then(() => {
        setTimeout(() => {
          client.guilds.cache.forEach((g) => {
            g.leave().then(() => console.log(`Left ${g.name}`)).catch(console.error);
          });
          config.Guild = newGuildId;
          fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => err && console.log(err));
        }, 3000);
      })
      .catch(console.error);

    message.react("✅").catch(console.error);
  },
};
