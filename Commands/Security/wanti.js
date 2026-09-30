const { EmbedBuilder, Colors } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "wanti",
  aliases: ["تحديد-شخص"],
  run: async (client, message, args) => {
    if (!message.guild) return;

    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      Colors.Blurple;

    const mentionedUser = message.mentions.users.first();
    const userID = mentionedUser?.id || args[0];

    if (!userID || isNaN(userID)) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة .\n wanti <@${message.author.id}>**`
        );
      return message.reply({ embeds: [embed] });
    }

    const user = await client.users.fetch(userID).catch(() => null);
    if (!user) return message.react("❌");

    const key = `wanti_${message.guild.id}`;
    const list = Pro.get(key) || [];
    const idx = list.indexOf(userID);

    if (idx !== -1) {
      list.splice(idx, 1);
      Pro.set(key, list);
      return message.react("☑️"); 
    } else {
      Pro.push(key, userID);
      return message.react("✅"); 
    }
  },
};
