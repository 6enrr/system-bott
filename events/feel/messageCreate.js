const db = require("pro.db");
const fs = require("fs");
const { EmbedBuilder, Colors } = require("discord.js");

const cooldown = new Map();

module.exports = async (client, message) => {

if (!message.guild) return;
if (message.author.bot) return;


const chatId = db.get(`feel_chat_${message.guild.id}`);

if (chatId && message.channel.id === chatId) {

const color =
db.get(`feel_color_${message.guild.id}`) || Colors.Blurple;

const embed = new EmbedBuilder()
.setColor(color)
.setDescription(`💬 ${message.content}`)
.setFooter({ text: "رسالة فضفضة مجهولة" });

await message.delete().catch(()=>{});

return message.channel.send({ embeds: [embed] });

}


const channels = db.get("Channels") || [];

const data = channels.find(c => c.channelID === message.channel.id);

if (!data) return;

const now = Date.now();
const last = cooldown.get(message.channel.id) || 0;

if (now - last < 5000) return;

cooldown.set(message.channel.id, now);

const imagePath = data.fontURL;

if (!fs.existsSync(imagePath)) return;

message.channel.send({ files: [imagePath] });

};