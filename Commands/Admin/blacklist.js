const {
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "blacklist",
  aliases: ["bl"],
  description: "منع عضو ودخوله بس قناة البلاك ليست",
  category: "Admin",
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

    const reason = args.slice(1).join(" ") || "بدون سبب";

    let blacklistRole = message.guild.roles.cache.find(
      (r) => r.name === "Blacklist"
    );
    if (!blacklistRole) {
      try {
        blacklistRole = await message.guild.roles.create({
          name: "Blacklist",
          color: 0xff0000,
          reason: "دور للبلاك ليست",
        });
      } catch (e) {
        console.log(e);
        return message.reply("ما قدرت اسوي الرتبة.");
      }
    }

    const list =
      (await Pro.get(`blacklist_${message.guild.id}`)) || [];
    if (list.includes(member.id))
      return message.reply("هذا الشخص أصلاً بلاك ليست.");

    await member.roles.add(blacklistRole).catch(() => {
      return message.reply("ما قدرت أعطيه الرتبة.");
    });

    let blChannelId = await Pro.get(
      `blacklistChat_${message.guild.id}`
    );
    let blChannel = blChannelId
      ? message.guild.channels.cache.get(blChannelId)
      : null;

    if (!blChannel) {
      blChannel = await message.guild.channels.create({
        name: "blacklist-chat",
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: message.guild.id,
            deny: ["ViewChannel"],
          },
          {
            id: blacklistRole.id,
            allow: ["ViewChannel"],
          },
          {
            id: member.id,
            allow: ["ViewChannel"],
          },
        ],
      });
      await Pro.set(
        `blacklistChat_${message.guild.id}`,
        blChannel.id
      );
    } else {
      await blChannel.permissionOverwrites
        .edit(member.id, { ViewChannel: true })
        .catch(() => {});
    }

    message.guild.channels.cache.forEach((ch) => {
      if (ch.id === blChannel.id) return;
      ch.permissionOverwrites
        .edit(member.id, { ViewChannel: false })
        .catch(() => {});
    });

    list.push(member.id);
    await Pro.set(`blacklist_${message.guild.id}`, list);

    const logId = await Pro.get(
      `blacklistLog_${message.guild.id}`
    );
    const logCh = message.guild.channels.cache.get(logId);

    const emb = new EmbedBuilder()
      .setColor("Red")
      .setDescription(
        `${member} تم حظره من كل الرومات، السبب: **${reason}**`
      );

    message.channel.send({ embeds: [emb] });

    if (logCh) {
      const logEmb = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Blacklisted")
        .setDescription(
          `العضو: ${member} \nالمنفذ: ${message.author}\nالسبب: ${reason}`
        )
        .setTimestamp();
      logCh.send({ embeds: [logEmb] });
    }
  },
};
