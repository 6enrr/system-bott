const config = require("../../config.json");
const Data = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "restart",
  description: "Restarts the bot.",
  async run(client, message) {
    const db = Data.get(`Allow - Command restart = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isOwner = owners.includes(message.author.id);

    if (!isOwner && (!allowedRole || !message.member.roles.cache.has(allowedRole.id))) {
      return message.reply("You do not have permission to use this command.");
    }

    const statusMessage = await message.channel.send("Restarting the bot...");
    try {
      await client.destroy();
      await client.login(config.token);
      await statusMessage.edit("Bot has been restarted.");
    } catch (e) {
      await statusMessage.edit(`ERROR: ${e.message}`);
    }
  },
};
