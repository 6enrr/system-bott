const Pro = require("pro.db");
const { EmbedBuilder } = require("discord.js");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "deny",
  aliases: ["حذف"],
  run: async function (client, message) {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#f5f5ff";

    const Args = message.content.split(" ");
    if (!Args[1]) {
      const Embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استخدام الأمر بالطريقة الصحيحة .**\n deny mute <@${message.author.id}>`);
      return message.reply({ embeds: [Embed] });
    }

    const embed = new EmbedBuilder().setColor(Color);

    const Roles = message.guild.roles.cache.get(Args[2]) || message.mentions.roles.first();
    const Member = message.guild.members.cache.get(Args[2]) || message.mentions.members.first();

    if (Roles || Member) {
      const permissionKey = `Allow - Command ${Args[1]} = [ ${message.guild.id} ]`;
      const existing = Pro.get(permissionKey);

      if (existing) {
        Pro.delete(permissionKey);
        embed.setDescription(`**تم إزالة صلاحية ${Roles || Member} ${Args[1]}**`);
      } else {
        embed.setDescription(`**${Roles || Member} لا يمتلك صلاحية ${Args[1]} لإزالتها.**`);
      }
      return message.reply({ embeds: [embed] });
    }

    return message.reply({ content: `**يرجى ارفاق منشن صحيح للرول أو العضو.**` });
  },
};
