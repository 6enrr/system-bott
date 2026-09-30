const db = require("pro.db");
const { EmbedBuilder, Colors } = require("discord.js");

module.exports = {
  name: "viewlogs",
  description: "View server logs.",
  usage: "!viewlogs",
  run: async (client, message) => {
    if (!message.guild) return message.reply("This command can only be used in a server.");

    const adminLogs = (await db.get(`admin_logs_${message.guild.id}`)) || [];
    if (!adminLogs.includes(message.author.id)) {
      return message.reply("You do not have permission to view the logs.");
    }

    const logTypes = [
      "channelmessage","logpic","logchannels","lognickname","logjoinleave","loglinks",
      "logbots","logroles","logvjoinvexit","logmove","logbanunban","logkick",
      "logemoji","logprisonunprison","logwarns","logtmuteuntmute"
    ];

    const logsEmbed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("Server Logs")
      .setDescription("Here are the channels where logs are stored:");

    let hasLogs = false;
    for (const type of logTypes) {
      const channelId = await db.get(`${type}_${message.guild.id}`);
      if (channelId) {
        const channel = message.guild.channels.cache.get(channelId);
        hasLogs = true;
        logsEmbed.addFields({
          name: type,
          value: channel ? `ID: ${channelId} (Name: ${channel.name})` : `ID: ${channelId} (Channel not found)`,
          inline: true
        });
      }
    }

    if (!hasLogs) return message.reply("No log channels have been set up yet.");
    message.channel.send({ embeds: [logsEmbed] });
  }
};
