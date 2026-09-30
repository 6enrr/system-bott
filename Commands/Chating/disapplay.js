const Pro = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "disapplay",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    await message.channel.permissionOverwrites.create(
      message.guild.roles.everyone,
      {
        [PermissionFlagsBits.MentionEveryone]: false,
        [PermissionFlagsBits.AttachFiles]: false,
      }
    );

    message.reply("**تم تعطيل المنشن والصور بالشات .**");
  },
};
