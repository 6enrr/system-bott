const {
  EmbedBuilder,
  PermissionsBitField,
  Colors
} = require("discord.js");
const db = require("pro.db");

module.exports = async (client, interaction) => {

if (!interaction.guild) return;

if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

if (interaction.customId === "feel_cancel") {

await interaction.update({
content: "❌ تم إلغاء الإعداد.",
components: []
});

return;
}

if (interaction.customId === "feel_menu") {

const value = interaction.values[0];

if (value === "set_chat") {

await interaction.reply({
content: "📌 اكتب الآن منشن الروم اللي تبيه شات فضفضة.",
ephemeral: true
});

const filter = (m) => m.author.id === interaction.user.id;

const collector = interaction.channel.createMessageCollector({
filter,
time: 20000,
max: 1
});

collector.on("collect", async (msg) => {

const channel = msg.mentions.channels.first();
if (!channel) return msg.reply("❌ لازم تذكر روم صحيح.");

db.set(`feel_chat_${interaction.guild.id}`, channel.id);

msg.reply(`✅ تم تحديد روم الفضفضة: ${channel}`);
});

}

if (value === "change_color") {

await interaction.reply({
content: "🎨 اكتب كود اللون مثل: `#ff0000`",
ephemeral: true
});

const filter = (m) => m.author.id === interaction.user.id;

const collector = interaction.channel.createMessageCollector({
filter,
time: 20000,
max: 1
});

collector.on("collect", async (msg) => {

const color = msg.content.trim();

if (!color.startsWith("#") || color.length !== 7)
return msg.reply("❌ اكتب كود لون صحيح مثل #ff0000");

db.set(`feel_color_${interaction.guild.id}`, color);

msg.reply("✅ تم تغيير لون الامبد بنجاح.");
});

}

}

};