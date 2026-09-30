const {
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Data = require("pro.db");
const db = require("pro.db");

module.exports = {
  name: "banner",
  aliases: ["بنر"],
  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const setChannel = Data.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    const Color =
      db.get(`Guild_Color_${message.guild?.id}`) || "#f5f5ff";

    let userId;
    if (message.mentions.users.size > 0) {
      userId = message.mentions.users.first().id;
    } else if (args[0]) {
      userId = args[0];
    } else {
      userId = message.author.id;
    }

    let user;
    try {
      user = await client.users.fetch(userId);
      await user.fetch();
    } catch (e) {
      return message.react("❌");
    }

    const banner = user.bannerURL({ size: 2048 });
    if (!banner) return message.react("❌");

    const att = new AttachmentBuilder(banner, {
      name: "banner.png",
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("تحميل")
        .setStyle(ButtonStyle.Link)
        .setURL(banner)
    );

    return message.reply({
      files: [att],
      components: [row],
    });
  },
};
