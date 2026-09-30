const Pro = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "applay",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    await message.channel.permissionOverwrites.create(
      message.guild.roles.everyone,
      {
        [PermissionFlagsBits.MentionEveryone]: true,
        [PermissionFlagsBits.AttachFiles]: true,
      }
    );

    message.reply("**تم تفعيل المنشن والصور بالشات  **");
  },
};
