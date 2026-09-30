const Data = require("pro.db");

module.exports = {
  name: "ping",
  run: (client, message) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    message.reply(`My ping is **${client.ws.ping}ms** 🎯`);
  },
};
