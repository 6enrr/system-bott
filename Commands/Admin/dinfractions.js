const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "dinfractions",
  aliases: ["عقوبات"],
  run: async (client, message, args) => {
    const color =
      db.get(`Guild_Color_${message.guild.id}`) || "#5c5e64";

    const allowId = db.get(
      `Allow_Command_modifyinfraction_${message.guild.id}`
    );
    const allowRole = message.guild.roles.cache.get(allowId);
    const canUse =
      message.member.permissions.has("Administrator") ||
      message.member.roles.cache.has(allowRole?.id);

    if (!canUse) return message.react("❌").catch(() => {});

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    if (!member) {
      const e = new EmbedBuilder()
        .setColor(color)
        .setDescription(
          `استعمل:\n dinfractions @عضو`
        );
      return message.reply({ embeds: [e] });
    }

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("dinf_add_mute")
        .setLabel("إضافة اسكات")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("dinf_add_voicemute")
        .setLabel("إضافة ميوت")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("dinf_add_prison")
        .setLabel("إضافة سجن")
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("dinf_remove_mute")
        .setLabel("حذف اسكات")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("dinf_remove_voicemute")
        .setLabel("حذف ميوت")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("dinf_remove_prison")
        .setLabel("حذف سجن")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(
        `**اختر نوع العقوبة اللي تبي تعدلها للعضو ${member}**`
      );

    const msg = await message.reply({
      embeds: [embed],
      components: [row1, row2],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      const [_, action, type] = i.customId.split("_");  

      await i.reply({
        content: `اكتب عدد العقوبات اللي تبي ${
          action === "add" ? "تضيفها" : "تحذفها"
        } للنوع: **${type}**`,
        ephemeral: true,
      });

      const msgCollector = message.channel.createMessageCollector({
        filter: (m) => m.author.id === message.author.id,
        time: 30_000,
        max: 1,
      });

      msgCollector.on("collect", (m) => {
        const num = parseInt(m.content);
        if (isNaN(num) || num <= 0)
          return m.reply("اكتب رقم صالح.");

        const keyMap = {
          mute: "Total_Mutes_",
          voicemute: "Total_voice_",
          prison: "Total_Prisons_",
        };

        const key = keyMap[type];
        if (!key) return;

        if (action === "add") db.add(`${key}${member.id}`, num);
        else db.sub(`${key}${member.id}`, num);

        m.reply(
          `تم ${
            action === "add" ? "إضافة" : "حذف"
          } **${num}** للنوع **${type}** للعضو ${member}`
        );
      });
    });

    collector.on("end", () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  },
};
