const db = require("pro.db");
const { prefix, owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "unline",
  description: "Remove mentions and formatting from text",
  usage: ` unline <#channel>`,
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = db.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    if (args.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة **\n unline <#${message.channel.id}>`);
      return message.reply({ embeds: [embed] });
    }

    const channelMention = args[0];
    const channelID = channelMention.replace(/[^0-9]/g, "");
    const storedChannels = (await db.get("Channels")) || [];
    const channelEntry = storedChannels.find((e) => e.channelID === channelID);

    if (!channelEntry) return message.reply(`**لا يوجد خط تلقائي هُنا**`);

    storedChannels.splice(storedChannels.indexOf(channelEntry), 1);
    db.set("Channels", storedChannels);
    message.react("✅");
  },
};
