const {
ModalBuilder,
TextInputBuilder,
TextInputStyle,
ActionRowBuilder
} = require("discord.js");

const db = require("pro.db");

module.exports = async (client, interaction) => {

if (interaction.isButton()) {

if (interaction.customId === "Auto_Reply") {

const modal = new ModalBuilder()
.setCustomId("Reply-Bot")
.setTitle("Reply");

const input1 = new TextInputBuilder()
.setCustomId("Auto-Reply")
.setLabel("اكتب الرسالة اللي يرد عليها البوت")
.setStyle(TextInputStyle.Paragraph)
.setRequired(true);

const input2 = new TextInputBuilder()
.setCustomId("Reply")
.setLabel("اكتب الرد")
.setStyle(TextInputStyle.Paragraph)
.setRequired(true);

const row1 = new ActionRowBuilder().addComponents(input1);
const row2 = new ActionRowBuilder().addComponents(input2);

modal.addComponents(row1, row2);

await interaction.showModal(modal);

}

}

if (interaction.isModalSubmit()) {

if (interaction.customId === "Reply-Bot") {

const word = interaction.fields.getTextInputValue("Auto-Reply");
const reply = interaction.fields.getTextInputValue("Reply");

if (db.get(`Replys_${word}`))
return interaction.reply({ content: "الرد موجود بالفعل", ephemeral: true });

db.push(`Replys_${word}`, {
Word: word,
Reply: reply
});

interaction.reply({
content: `✅ تم إضافة الرد\n**الكلمة:** ${word}\n**الرد:** ${reply}`,
ephemeral: true
});

}

}

};