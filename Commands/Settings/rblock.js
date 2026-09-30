const { EmbedBuilder, Colors } = require("discord.js");
const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "rblock",
  description: "Block a user from having a specific role.",
  usage: `  rblock @user @role`,
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const userMention = message.mentions.users.first();
    const roleMention = message.mentions.roles.first();

    if (!userMention || !roleMention) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("Missing Arguments")
        .setDescription(`Please mention a user and a role to block.\nUsage: \`  rblock @user @role\``);
      return message.reply({ embeds: [embed] });
    }

    const blockedUsers = db.get(`blocked_users_${message.guild.id}`) || {};
    if (!blockedUsers[roleMention.id]) blockedUsers[roleMention.id] = [];

    if (blockedUsers[roleMention.id].includes(userMention.id)) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Yellow)
        .setTitle("Already Blocked")
        .setDescription(`User ${userMention} is already blocked from obtaining the role ${roleMention}.`);
      return message.reply({ embeds: [embed] });
    }

    blockedUsers[roleMention.id].push(userMention.id);
    await db.set(`blocked_users_${message.guild.id}`, blockedUsers);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("Role Blocked")
      .setDescription(`User ${userMention} has been blocked from obtaining the role ${roleMention}.`)
      .setFooter({ text: "The bot will remove the role if it gets assigned." });

    message.channel.send({ embeds: [embed] });
  },
};
