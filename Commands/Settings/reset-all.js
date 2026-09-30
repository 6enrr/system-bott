const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Data = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "reset-all",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const allUsers = await Data.fetchAll();
    let totalPoints = 0;
    let usersCount = 0;

    for (const [key, value] of Object.entries(allUsers)) {
      if (key.endsWith("_points") || key.endsWith("_voice")) {
        totalPoints += Number(value) || 0;
        usersCount++;
      }
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("confirm").setLabel("نعم").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("cancel").setLabel("إلغاء").setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({
      content: `هل ترغب حقًا في مسح جميع النقاط لجميع المستخدمين؟\n**إجمالي النقاط:** ${totalPoints}\n**عدد الأشخاص:** ${usersCount}`,
      components: [row],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id && ["confirm", "cancel"].includes(i.customId),
      time: 15_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "confirm") {
        for (const [key] of Object.entries(allUsers)) {
          if (key.endsWith("_points") || key.endsWith("_voice")) {
            Data.delete(key);
          }
        }
        await i.reply("> **تم مسح النقاط لجميع المستخدمين.** ✅");
        await msg.delete().catch(() => {});
        collector.stop();
      } else {
        await i.reply("> **تم إلغاء عملية مسح النقاط لجميع المستخدمين.** ✅");
        await msg.delete().catch(() => {});
        collector.stop();
      }
    });

    collector.on("end", async () => {
      if (msg.deletable) await msg.delete().catch(() => {});
    });
  },
};
