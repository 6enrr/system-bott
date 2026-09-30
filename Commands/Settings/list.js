const Pro = require("pro.db");
const db = require("pro.db");
const { EmbedBuilder, Colors } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "al",
  aliases: ["سماح"],
  run: async function (client, message) {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color =
      db.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#f5f5ff";

    const Args = message.content.split(" ");
    if (!Args[1]) {
      return message.reply({ content: `**يرجى ارفاق منشن او ايدي العضو او رول .**` });
    }

    const embed = new EmbedBuilder().setColor(Color || Colors.Blurple);

    const Roles =
      message.guild.roles.cache.get(Args[2]) || message.mentions.roles.first();
    if (Roles) {
      const permissionKey = `Allow - Command ${Args[1]} = [ ${message.guild.id} ]`;
      const existing = Pro.get(permissionKey);
      if (existing) {
        Pro.delete(permissionKey);
        embed.setDescription(`**تم حذف صلاحية ${Roles} ${Args[1]}**`);
      } else {
        Pro.set(permissionKey, Roles.id);
        embed.setDescription(`**تم منح ${Roles} صلاحية ${Args[1]}**`);
      }
      return message.reply({ embeds: [embed] });
    }

    const Member =
      message.guild.members.cache.get(Args[2]) || message.mentions.members.first();
    if (Member) {
      const permissionKey = `Allow - Command ${Args[1]} = [ ${message.guild.id} ]`;
      const existing = Pro.get(permissionKey);
      if (existing) {
        Pro.delete(permissionKey);
        embed.setDescription(`**تم حذف صلاحية ${Member} ${Args[1]}**`);
      } else {
        Pro.set(permissionKey, Member.id);
        embed.setDescription(`**تم منح ${Member} صلاحية ${Args[1]}**`);
      }
      return message.reply({ embeds: [embed] });
    }

    return message.reply({ content: `**يرجى ارفاق منشن صحيح للرول أو العضو.**` });
  },
};
