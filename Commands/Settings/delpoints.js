const Data = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "delpoints",
  aliases: ["resetpoints"],
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const allUsers = await Data.fetchAll();
    for (const key in allUsers) {
      if (key.endsWith("_messageCount") || key.endsWith("_points")) {
        await Data.delete(key);
      }
    }
    message.react("✅");
  },
};
