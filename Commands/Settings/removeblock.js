const { EmbedBuilder, Colors } = require("discord.js");
const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "runblock",
  description: "Remove a block from a user for a specific role.",
  usage: `  runblock @user @role`,
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const userMention = message.mentions.users.first();
    const roleMention = message.mentions.roles.first();

    if (!userMention || !roleMention) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("Missing Arguments")
        .setDescription(`Please mention a user and a role to unblock.\nUsage: \`  runblock @user @role\``);
      return message.reply({ embeds: [embed] });
    }

    const blockedUsers = db.get(`blocked_users_${message.guild.id}`) || {};

    if (!blockedUsers[roleMention.id] || !blockedUsers[roleMention.id].includes(userMention.id)) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Yellow)
        .setTitle("Not Blocked")
        .setDescription(`User ${userMention} is not blocked from the role ${roleMention}.`);
      return message.reply({ embeds: [embed] });
    }

    blockedUsers[roleMention.id] = blockedUsers[roleMention.id].filter(id => id !== userMention.id);
    if (blockedUsers[roleMention.id].length === 0) delete blockedUsers[roleMention.id];
    await db.set(`blocked_users_${message.guild.id}`, blockedUsers);

    const member = message.guild.members.cache.get(userMention.id);
    if (member && !member.roles.cache.has(roleMention.id)) {
      await member.roles.add(roleMention).catch(() => {});
      member.send(`You have been unblocked and have now received the role ${roleMention.name}.`).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("Blocked User Removed")
      .setDescription(`User ${userMention} has been unblocked from obtaining the role ${roleMention}.`);
    message.channel.send({ embeds: [embed] });
  }
};
