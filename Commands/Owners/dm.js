const { EmbedBuilder } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Data = require("pro.db");

module.exports = {
  name: "dm",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    if (args.length < 2) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n dm <@${message.author.id}> حللت أهلًا**`);
      return message.reply({ embeds: [embed] });
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply("يرجى توجيه الرسالة لعضو موجود في السيرفر.");

    const content = args.slice(1).join(" ");
    await target.send(content).catch(() => null);
    return message.react("✅");
  },
};
