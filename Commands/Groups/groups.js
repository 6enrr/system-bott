const { EmbedBuilder, Colors } = require("discord.js");
const Data = require("pro.db");

module.exports = {
  name: "groups",
  aliases: ["lgroups", "listgroups", "قروبات"],
  description: "يعرض لك القروبات المسجله بالنظام",
  usage: ["groups"],
  run: async (client, message) => {
    try {
      const all = await Promise.resolve(Data.all());
      if (!all || !all.length) return message.reply("ما فيه قروبات مسجله بالنظام");

      const prefix = `group_${message.guild.id}_`;
      const groups = all
        .filter((x) => typeof x?.id === "string" && x.id.startsWith(prefix))
        .map((x) => x.value)
        .filter((g) => g && g.name && g.ownerId && g.categoryId);

      if (!groups.length) return message.reply("ما فيه قروبات مسجله بالنظام");

      groups.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      const slice = groups.slice(0, 25);

      const desc = slice
        .map((g, i) => {
          return (
            `${i + 1}) ${g.name}\n` +
            `- المالك: <@${g.ownerId}>\n` +
            `- الكاتجوري: <#${g.categoryId}>\n` +
            `- الرول: ${g.roleId ? `<@&${g.roleId}>` : "مافي"}\n`
          );
        })
        .join("\n");

      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle(`القروبات المسجله (${groups.length})`)
        .setDescription(desc)
        .setFooter({ text: groups.length > 25 ? "يعرض اول 25 بس" : " " });

      return message.channel.send({ embeds: [embed] });
    } catch (e) {
      console.error("groups cmd error:", e);
      return message.reply("صار خطا وانا اعرض القروبات");
    }
  },
};