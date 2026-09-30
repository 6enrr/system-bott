const {
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
AttachmentBuilder
} = require("discord.js");

const { createCanvas, registerFont, loadImage } = require("canvas");
const db = require("pro.db");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { prefix } = require(`${process.cwd()}/config`);

let CanvasCtor;
try {
({ Canvas: CanvasCtor } = require("canvas-constructor/cairo"));
} catch (e) {
const cc = require("canvas-constructor");
CanvasCtor = cc.Canvas;
}

module.exports = {
name: "rate",
aliases: ["تقييم"],
description: "Rate a user with background",
usage: [`rate @user`],

run: async function (client, message, args) {

const isEnabled = db.get(`command_enabled_${module.exports.name}`);
if (isEnabled === false) return;

const Color = "#2C2F33";

const roleId = db.get(`Allow - Command rate = [ ${message.guild.id} ]`);
const allowedRole = message.guild.roles.cache.get(roleId);
const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

if (
!isAuthorAllowed &&
message.author.id !== roleId &&
!message.member.permissions.has("Administrator")
) {
return message.react("❌");
}

const mentionedUser = message.mentions.users.first();

if (!mentionedUser)
return message.reply("Please mention a user to rate!");

if (mentionedUser.bot)
return message.reply("Cannot rate bots!");

try {

const button = new ButtonBuilder()
.setCustomId(`rate_${mentionedUser.id}`)
.setLabel("تقييم")
.setStyle(ButtonStyle.Primary);

const row = new ActionRowBuilder().addComponents(button);

const embed = new EmbedBuilder()
.setColor(Color)
.setTitle("تقييم العميل")
.setDescription(`اضغط على الزر للتقييم ${mentionedUser}`)
.setThumbnail(
mentionedUser.displayAvatarURL({ extension: "png", size: 256 })
);

const ratingMessage = await message.channel.send({
embeds: [embed],
components: [row],
});

const filter = (i) => i.customId === `rate_${mentionedUser.id}`;

const collector = ratingMessage.createMessageComponentCollector({
filter,
time: 300000,
});

collector.on("collect", async (interaction) => {

await interaction.reply({
content: "اكتب تقييمك خلال 60 ثانية:",
ephemeral: true,
});

const messageFilter = (m) => m.author.id === interaction.user.id;

const feedbackCollector = message.channel.createMessageCollector({
filter: messageFilter,
max: 1,
time: 60000,
});

feedbackCollector.on("collect", async (m) => {

const feedbackChannelId = db.get(
`feedback_channel_${message.guild.id}`
);

const feedbackChannel =
message.guild.channels.cache.get(feedbackChannelId);

if (!feedbackChannel) {
return interaction.followUp({
content: "Feedback channel not found.",
ephemeral: true,
});
}

try {

const bg = await loadImage(
`${process.cwd()}/Fonts/ret-us.png`
).catch(() => null);

const canvas = new CanvasCtor(914, 316);

if (bg) {
canvas.printImage(bg, 0, 0, 914, 316);
} else {
canvas.setColor("#2f3136").printRectangle(0, 0, 914, 316);
}

canvas
.setColor("rgba(47, 49, 54, 0.85)")
.printRoundedRectangle(20, 20, 650, 276, 25)
.setColor("rgba(47, 49, 54, 0.75)")
.printRoundedRectangle(690, 20, 204, 276, 25)
.setTextAlign("right")
.setColor("#FFFFFF")
.setTextFont("bold 20px Cairo")
.printText("تقييم العميل :", 600, 50)
.setTextFont("bold 28px Cairo")
.printText(m.content.slice(0, 120), 630, 150)
.setColor("#FFFFFF")
.beginPath()
.arc(792, 140, 42, 0, Math.PI * 2)
.closePath()
.fill()
.setColor("rgba(47, 49, 54, 0.75)")
.beginPath()
.arc(792, 140, 40, 0, Math.PI * 2)
.closePath()
.fill();

const avatar = await loadImage(
mentionedUser.displayAvatarURL({ extension: "png", size: 256 })
).catch(() => null);

if (avatar) {
canvas.printCircularImage(avatar, 792, 140, 80, 80);
}

canvas
.setTextAlign("center")
.setColor("#FFFFFF")
.setTextFont("bold 24px Cairo")
.printText(mentionedUser.username, 792, 250);

const buffer = canvas.toBuffer();

const attachment = new AttachmentBuilder(buffer, { name: "rating.png" });

await feedbackChannel.send({
content: `<@${mentionedUser.id}>`,
files: [attachment],
});

const linePath = `${process.cwd()}/Fonts/line.gif`;

if (fs.existsSync(linePath)) {

const lineAttachment = new AttachmentBuilder(linePath, { name: "line.png" });

await feedbackChannel.send({
files: [lineAttachment],
});

}

await interaction.followUp({
content: "تم التقييم بنجاح!",
ephemeral: true,
});

await ratingMessage.delete().catch(() => {});

} catch (err) {

console.error("Error creating image:", err);

await interaction.followUp({
content: "Error creating rating image. Please try again.",
ephemeral: true,
});

}

});

feedbackCollector.on("end", (collected) => {

if (collected.size === 0) {

interaction.followUp({
content: "Time expired. Please try again.",
ephemeral: true,
});

}

});

});

} catch (err) {

console.error("Error processing command:", err);

message.reply("An error occurred. Please try again.");

}

}
};