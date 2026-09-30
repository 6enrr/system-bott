const { owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: "setecolor",
  description: "تغيير اللون الافتراضي للـ embeds في السيرفر.",
  run: async (client, message) => {
    if (!message.guild) return;

    const Data = db.get(`Allow - Command setecolor = [ ${message.guild.id} ]`);
    const allowedRole = Data ? message.guild.roles.cache.get(Data) : null;

    const isAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === Data ||
      owners.includes(message.author.id);

    if (!isAllowed) return message.react("❌");

    const args = message.content.trim().split(/\s+/);
    const Color = args[1];

    if (!Color || Color.length !== 7 || !Color.startsWith("#")) {
      return message.reply({
        content: "**يرجى وضع كود اللون بشكل صحيح، مثل: `#ff0000` ⛔️**",
      });
    }

    db.set(`Guild_Color = ${message.guild.id}`, Color);
    message.react("✅");
  },
};
