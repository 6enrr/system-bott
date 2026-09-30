const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "tcrestart",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const g = message.guild.id;
    for (const k of [`Channel = [${g}]`, `Role = [${g}]`, `Image = [${g}]`, `Cat = [${g}]`, `menuOptions_${g}`]) {
      if (db.get(k)) db.delete(k);
    }

    const memberKey = `member${message.author.id}`;
    const channelKey = `channel${message.author.id}_${message.channel.id}`;
    if (db.get(memberKey)) db.delete(memberKey);
    if (db.get(channelKey)) db.delete(channelKey);

    message.react("✅");
  },
};
