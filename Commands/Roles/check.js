const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const { owners, prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "check",
  run: async (client, message) => {
    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.members.me?.displayHexColor ||
      "#f5f5ff";

    const db = Pro.get(`Allow - Command check = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === db ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
      owners.includes(message.author.id);

    if (!isAuthorAllowed) return message.react("❌");

    const args = message.content.split(" ");
    const roleId = args[1];
    const role = message.guild.roles.cache.find(
      (e) => e.id === roleId || e.name === roleId || `<@&${e.id}>` === roleId
    );

    if (!role) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة .\n check @Role**`
        );
      return message.reply({ embeds: [embed] });
    }

    const members = Array.from(role.members.values());
    const totalPages = Math.ceil(members.length / 10);
    let page = 1;

    const sendList = (page) => {
      const start = (page - 1) * 10;
      const end = page * 10;
      const memberList = members
        .slice(start, end)
        .map((member, index) => `\`${index + 1}\` - <@${member.user.id}>`)
        .join("\n");
      return `**الصفحة ${page}/${totalPages}\n${memberList || "لا يوجد أعضاء"}**`;
    };

    const messageToSend = await message.reply({
      content: sendList(page),
      components: [createButtons()],
    });

    function createButtons() {
      const prev = new ButtonBuilder()
        .setCustomId("previous")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Primary);
      const next = new ButtonBuilder()
        .setCustomId("next")
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Primary);
      const row = new ActionRowBuilder().addComponents(prev, next);
      if (totalPages <= 1) row.components.forEach((c) => c.setDisabled(true));
      return row;
    }

    const collector = messageToSend.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "previous") page = Math.max(1, page - 1);
      if (i.customId === "next") page = Math.min(totalPages, page + 1);
      await i.update({ content: sendList(page), components: [createButtons()] });
    });

    collector.on("end", () => {
      messageToSend.edit({ content: sendList(page), components: [] });
    });
  },
};
