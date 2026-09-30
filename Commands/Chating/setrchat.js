const d8b = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "setrchat",
  description: "To set channel room",
  usage: "!set-channel <channel>",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = d8b.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const channel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(message.content.split(" ")[1]);

    if (!channel) return message.reply("**يرجى ارفاق منشن الشات او الايدي  **");

    d8b.set(`setevaluation_${message.guild.id}`, channel.id);
    message.react("✅");
  },
};
