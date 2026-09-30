const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "autoreply",
  aliases: ["إضافة"],
  description: "زر لإضافة رد تلقائي",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("Auto_Reply")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("أضغط لإضفه ردًا ")
    );

    await message.reply({ components: [row] });
  },
};
