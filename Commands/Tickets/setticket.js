const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, Colors } = require("discord.js");
const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "setticket",
  description: "إرسال واجهة فتح التذاكر",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = db.get(`Guild_Color = ${message.guild?.id}`) ||
                  message.guild.members.me?.displayHexColor || Colors.Blurple;

    const Image = db.get(`Image = [${message.guild.id}]`);
    const Channel = db.get(`Channel = [${message.guild.id}]`);
    const Role = db.get(`Role = [${message.guild.id}]`);
    const Cat = db.get(`Cat = [${message.guild.id}]`);

    if (!Cat || !Role || !Channel || !Image) {
      const need = [];
      if (!Cat) need.push(`\`#1\`  tcopen : تعيين الكاتاقوري`);
      if (!Role) need.push(`\`#2\`  tcrole : اضافة رولات التذكرة`);
      if (!Channel) need.push(`\`#3\`  ticlog : تعين شات لوج التذكرة`);
      if (!Image) need.push(`\`#4\`  ticimage : تعيين صورة التذكرة`);

      const miss = new EmbedBuilder().setColor(Color).setDescription(`**يرجى تنصيب باقي الأوامر:**\n${need.join("\n")}.`);
      return message.reply({ embeds: [miss] });
    }

    const menuOptions = db.get(`menuOptions_${message.guild.id}`) || [{ label: "افتح تذكرتك من هُنا.", value: "M1" }];

    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId("M0").setPlaceholder("الرجاء الضغط هنا واختيار التذكرة المناسبة.").addOptions(menuOptions)
    );

    const args = message.content.split(" ").slice(1);
    if (args.length > 0) {
      const userMessage = args.join(" ");
      const embed = new EmbedBuilder().setDescription(userMessage).setColor(Color).setImage(Image);
      await message.channel.send({ embeds: [embed], components: [selectRow] });
      return message.delete().catch(() => {});
    }

    await message.channel.send({ files: [Image], components: [selectRow] });
    await message.delete().catch(() => {});
  },
};
