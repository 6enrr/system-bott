const { ChannelType, PermissionsBitField } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: "chanpro",
  description: "إنشاء قنوات حماية أساسية داخل كاتيجوري واحد وحفظها في DB.",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    try {
      const category = await message.guild.channels.create({
        name: "Protection System",
        type: ChannelType.GuildCategory,
        reason: "إعداد قنوات الحماية",
      });

      const names = [
        { key: "antibot", label: "antibot-logs" },
        { key: "antispam", label: "antispam-logs" },
        { key: "antilink", label: "antilink-logs" },
        { key: "antirole", label: "antirole-logs" },
        { key: "antichannel", label: "antichannel-logs" },
      ];

      for (const { key, label } of names) {
        const ch = await message.guild.channels.create({
          name: label,
          type: ChannelType.GuildText,
          parent: category.id,
          reason: `إنشاء قناة لوق: ${label}`,
          permissionOverwrites: [
            {
              id: message.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
          ],
        });
        db.set(`${key}_${message.guild.id}`, ch.id);
      }

      message.react("✅");
    } catch (e) {
      console.error(e);
      message.reply("حدث خطأ أثناء إنشاء قنوات الحماية.");
    }
  },
};
