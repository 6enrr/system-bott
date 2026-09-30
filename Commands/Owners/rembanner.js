const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "rembanner",
  aliases: ["rmbn"],
  run: async function (client, message) {
    if (!owners.includes(message.author.id)) {
      return message.reply("You do not have permission to use this command.");
    }
    try {
      const rest = new REST({ version: "10" }).setToken(client.token);
      await rest.patch(Routes.user(), { body: { banner: null } });
      return message.reply("Your banner has been successfully removed! ✅");
    } catch (error) {
      console.error(error);
      return message.reply(`An error occurred while removing the banner: \`${error.message}\``);
    }
  },
};
