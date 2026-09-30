const { drawCircle } = require("editor-canvas");
const Data = require("pro.db");

module.exports = {
  name: "circle",
  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const setChannel = Data.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    if (!message.guild || message.author.bot) return;

    const user =
      message.mentions.members.first() ||
      (args[0]
        ? await client.users.fetch(args[0]).catch(() => null)
        : null) ||
      message.member;

    let avatar;
    const attach = message.attachments.first();
    if (attach) {
      avatar = attach.url;
    } else if (args[0]?.startsWith("http")) {
      avatar = args[0];
    } else if (user) {
      avatar = user.displayAvatarURL({
        extension: "jpg",
        size: 2048,
      });
    }

    try {
      const img = await drawCircle({ image: avatar });
      await message.reply({ files: [img] });
    } catch (e) {
      return message.reply("> خطأ! ما قدرت أتعرف على الصورة");
    }
  },
};
