const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "progress",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const args = message.content.split(" ");
    const command = args[1];

    if (command === "on" || command === "فعل") {
      db.set(`levels-${message.guild.id}`, true);
      message.react("✅");
    } else if (command === "off" || command === "وقف") {
      db.set(`levels-${message.guild.id}`, false);
      message.react("✅");
    } else {
      message.reply("فعل/وقف");
    }
  },
};
