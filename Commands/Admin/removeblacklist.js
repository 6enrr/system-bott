const {
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "remove-blacklist",
  aliases: ["unblacklist"],
  run: async (client, message, args) => {
    if (!message.guild) return;
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return message.reply("ما عندك صلاحية.");
    }

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member) return message.reply("منشن عضو.");

    const list =
      (await Pro.get(`blacklist_${message.guild.id}`)) || [];
    if (!list.includes(member.id))
      return message.reply("العضو مو بلاك.");

    const role = message.guild.roles.cache.find(
      (r) => r.name === "Blacklist"
    );
    if (role && member.roles.cache.has(role.id)) {
      await member.roles.remove(role).catch(() => {});
    }

    message.guild.channels.cache.forEach((ch) => {
      ch.permissionOverwrites
        .edit(member.id, { ViewChannel: null })
        .catch(() => {});
    });

    const newList = list.filter((id) => id !== member.id);
    await Pro.set(`blacklist_${message.guild.id}`, newList);

    const emb = new EmbedBuilder()
      .setColor("Green")
      .setDescription(`تم فك البلاك عن ${member} ✅`);

    message.channel.send({ embeds: [emb] });
  },
};
