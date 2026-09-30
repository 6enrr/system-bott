const {
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "setupBlacklistChat",
  aliases: ["setupblchat"],
  run: async (client, message, args) => {
    if (!message.guild) return;
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return message.reply("ما عندك صلاحية.");
    }

    const ch =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]);
    if (!ch) return message.reply("منشن روم.");

    let blacklistRole = message.guild.roles.cache.find(
      (r) => r.name === "Blacklist"
    );
    if (!blacklistRole) {
      blacklistRole = await message.guild.roles.create({
        name: "Blacklist",
        color: 0xff0000,
        reason: "دور للبلاك ليست",
      });
    }

    await ch.permissionOverwrites.edit(message.guild.id, {
      ViewChannel: false,
    });
    await ch.permissionOverwrites.edit(blacklistRole.id, {
      ViewChannel: true,
    });

    await Pro.set(`blacklistChat_${message.guild.id}`, ch.id);

    const emb = new EmbedBuilder()
      .setColor("Blue")
      .setDescription(
        `تم تحديد ${ch} كروم البلاك ليست ✅`
      );

    message.channel.send({ embeds: [emb] });
  },
};
