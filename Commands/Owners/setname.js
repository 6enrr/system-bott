const { owners } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "setname",
  run: async (client, message) => {
    const db = Pro.get(`Allow - Command setname = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
    const isOwner = owners.includes(message.author.id);

    if (!isAuthorAllowed && message.author.id !== db && !isOwner) {
      return message.react("❌");
    }

    const args = message.content.split(" ");
    const name = args.slice(1).join(" ").trim();
    if (!name) return message.reply("⛔️ **يرجى ارفاق الاسم الجديد .**");

    try {
      await client.user.setUsername(name);
      message.react("✅");
    } catch (e) {
      console.error(e);
      message.react("❌");
    }
  },
};
