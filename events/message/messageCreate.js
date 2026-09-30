const db = require("pro.db");

module.exports = async (client, message) => {

if (!message || !message.guild || message.author.bot) return;


const reactData = db.get(`RoomInfo_${message.guild.id}_${message.channel.id}`);

if (reactData && Array.isArray(reactData.emojis)) {

for (const emoji of reactData.emojis) {
try {
await message.react(emoji);
} catch {}
}

}


if (message.content.trim().startsWith("!")) return;

const guildPrefix = (await db.get(`Guild_Prefix = ${message.guild.id}`)) || "";

const args = message.content.trim().split(/\s+/);
const cmdName = args.shift().toLowerCase();

const command =
client.commands.get(cmdName) ||
client.commands.get(client.aliases.get(cmdName));

if (!command) return;

try {

if (typeof command.run === "function") {
await command.run(client, message, args);
}

else if (typeof command.execute === "function") {
await command.execute(client, message, args);
}

else if (typeof command === "function") {
await command(client, message, args);
}

} catch (err) {

console.error(`❌ خطأ في الأمر ${cmdName}:`, err);
message.reply("حدث خطأ أثناء تنفيذ الأمر.");

}

};