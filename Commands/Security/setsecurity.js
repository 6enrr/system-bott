const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { ChannelType, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "setsecurity",
  description: "إنشاء قنوات لوق الحماية في السيرفر.",
  usage: "!setsecurity",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    try {
      const category = await message.guild.channels.create({
        name: "Security Log",
        type: ChannelType.GuildCategory,
        reason: "إعداد قنوات سجلات الأمان (Security Logs)",
      });

      const channels = [
        { name: "log-antidelete", keyy: "logantidelete" },
        { name: "log-protection", keyy: "logprotection" },
        { name: "log-antijoinbots", keyy: "logantijoinbots" },
        { name: "log-blocklist", keyy: "logblocklist" },
      ];

      for (const { name, keyy } of channels) {
        const channel = await message.guild.channels.create({
          name,
          type: ChannelType.GuildText,
          parent: category.id,
          reason: `إنشاء قناة لوق: ${name}`,
        });

        await channel.permissionOverwrites.create(message.guild.roles.everyone, {
          ViewChannel: false,
        });

        db.set(`${keyy}_${message.guild.id}`, channel.id);
      }

      message.react("✅");
    } catch (error) {
      console.error("حدث خطأ أثناء إنشاء قنوات الحماية:", error);
      message.reply("❌ حدث خطأ أثناء إعداد اللوقات، تحقق من صلاحياتي.");
    }
  },
};
