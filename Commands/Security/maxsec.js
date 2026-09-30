const dbq = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "maxsec",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const gid = message.guild.id;

    const state = (await dbq.get(`protectionEnabled_${gid}`)) || false;
    await dbq.set(`protectionEnabled_${gid}`, !state);

    return message.channel.send(state ? "تم إيقاف الحماية." : "تم تفعيل الحماية.");
  },
};
