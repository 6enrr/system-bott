const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require("discord.js");
const Pro = require(`pro.db`);

module.exports = {
  name: "myrole",
  aliases: ["رولي"],
  run: async (client, message) => {
    if (!message.guild) return;

    const userID = message.author.id;
    const userRoles = Pro.get(`userRoles_${userID}`);

    if (!userRoles || userRoles.length === 0) {
      return message.reply({ content: "**لا تملك أي رول خاص.**" });
    }

    const rolesMentions = userRoles.map(id => `<@&${id}>`).join(", ");

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('roleOptions')
      .setPlaceholder('يرجى الاختيار ..')
      .addOptions(
        { label: 'اسم الرول', description: 'تغير اسم رولك الخاص.', value: 'roleName' },
        { label: 'لون الرول', description: 'تغير لون رولك الخاص.', value: 'roleColor' },
        { label: 'صورة الرول', description: 'إضافة اموجي او صورة لرولك الخاص.', value: 'roleImage' },
        { label: 'مشاركة الرول', description: 'اعطاء الرول لشخص آخر.', value: 'giveMyRole' },
        { label: 'إزالة مشاركة', description: 'ازالة الرول من شخص.', value: 'removeRole' },
        { label: 'حذف الرول', value: 'deleteRole' },
      );

    const cancelBtn = new ButtonBuilder()
      .setCustomId('Cancel3')
      .setLabel('الغاء')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const buttonRow = new ActionRowBuilder().addComponents(cancelBtn);

    const replyMessage = await message.reply({
      content: `**الرول الخاص : ${rolesMentions}**`,
      components: [row, buttonRow],
    });

    const menuFilter = (i) => i.customId === 'roleOptions' && i.user.id === userID;
    const buttonFilter = (i) => i.customId === 'Cancel3' && i.user.id === userID;

    const menuCollector = replyMessage.createMessageComponentCollector({ filter: menuFilter, time: 120000 });
    const buttonCollector = replyMessage.createMessageComponentCollector({ filter: buttonFilter, time: 120000 });

    const getRoles = () => userRoles
      .map(roleID => message.guild.roles.cache.get(roleID))
      .filter(Boolean);

    menuCollector.on('collect', async (interaction) => {
      const selected = interaction.values[0];

      if (selected === 'roleColor') {
        await interaction.reply({ content: '**أرسل كود اللون فـ الشات ( مثال #ffffff ) .**', ephemeral: true });

        const filter = (m) => m.author.id === userID;
        const colorCollector = message.channel.createMessageCollector({ filter, time: 60000 });

        colorCollector.on('collect', async (response) => {
          if (response.author.id !== userID) return;
          const roleColor = response.content.trim();

          for (const role of getRoles()) {
            await role.setColor(roleColor).catch(() => {});
          }

          await interaction.followUp({ content: '✅ تم تحديث لون الرول.', ephemeral: true });
          colorCollector.stop();
        });
      }

      if (selected === 'deleteRole') {
        for (const role of getRoles()) {
          await role.delete().catch(() => {});
        }
        Pro.delete(`userRoles_${userID}`);
        await interaction.reply({ content: '✅ تم حذف الرول الخاص بك.', ephemeral: true });
        return replyMessage.delete().catch(() => {});
      }

      if (selected === 'roleName') {
        await interaction.reply({ content: '**أرسل اسم الرول الجديد في الشات.**', ephemeral: true });

        const filter = (m) => m.author.id === userID;
        const nameCollector = message.channel.createMessageCollector({ filter, time: 60000 });

        nameCollector.on('collect', async (response) => {
          if (response.author.id !== userID) return;
          const newName = response.content.trim();

          for (const role of getRoles()) {
            await role.setName(newName).catch(() => {});
          }

          await interaction.followUp({ content: '✅ تم تحديث اسم الرول.', ephemeral: true });
          nameCollector.stop();
        });
      }

      if (selected === 'roleImage') {
        await interaction.reply({ content: '**أرسل إيموجي مخصص أو صورة.**', ephemeral: true });

        const filter = (m) => {
          if (m.author.id !== userID) return false;
          if (m.attachments.size > 0) return true;
          return /<a?:\w+:(\d{15,})>/.test(m.content);
        };

        const imgCollector = message.channel.createMessageCollector({ filter, time: 60000 });

        imgCollector.on('collect', async (response) => {
          let iconURL;
          if (response.attachments.size > 0) {
            iconURL = response.attachments.first().url;
          } else {
            const match = response.content.match(/<a?:\w+:(\d{15,})>/);
            if (match) iconURL = `https://cdn.discordapp.com/emojis/${match[1]}.png`;
          }
          if (!iconURL) {
            await interaction.followUp({ content: '**الرجاء إرسال إيموجي أو صورة صحيحة.**', ephemeral: true });
            return;
          }

          for (const role of getRoles()) {
            await role.setIcon(iconURL).catch(() => {});
          }
          await interaction.followUp({ content: '✅ تم تحديث صورة الرول.', ephemeral: true });
          imgCollector.stop();
        });
      }

      if (selected === 'giveMyRole') {
        await interaction.reply({ content: '**ارسل منشن الشخص الذي تريد اعطاؤه الرول.**', ephemeral: true });

        const filter = (m) => m.author.id === userID && m.mentions.users.size > 0;
        const mentionCollector = message.channel.createMessageCollector({ filter, time: 60000 });

        mentionCollector.on('collect', async (response) => {
          const target = response.mentions.users.first();
          const member = target ? message.guild.members.cache.get(target.id) : null;
          if (!member) {
            await interaction.followUp({ content: '**هذا الشخص غير موجود في السيرفر.**', ephemeral: true });
            return;
          }
          for (const role of getRoles()) {
            await member.roles.add(role).catch(() => {});
          }
          await interaction.followUp({ content: `✅ تم اعطاء الرول لـ ${target}.`, ephemeral: true });
          mentionCollector.stop();
        });
      }

      if (selected === 'removeRole') {
        await interaction.reply({ content: '**ارسل منشن الشخص الذي تريد ازالة الرول منه.**', ephemeral: true });

        const filter = (m) => m.author.id === userID && m.mentions.users.size > 0;
        const mentionCollector = message.channel.createMessageCollector({ filter, time: 60000 });

        mentionCollector.on('collect', async (response) => {
          const target = response.mentions.users.first();
          const member = target ? message.guild.members.cache.get(target.id) : null;
          if (!member) {
            await interaction.followUp({ content: '**هذا الشخص غير موجود في السيرفر.**', ephemeral: true });
            return;
          }
          for (const role of getRoles()) {
            await member.roles.remove(role).catch(() => {});
          }
          await interaction.followUp({ content: `✅ تمت إزالة الرول من ${target}.`, ephemeral: true });
          mentionCollector.stop();
        });
      }
    });

    buttonCollector.on('collect', async (i) => {
      await i.deferUpdate().catch(() => {});
      return replyMessage.delete().catch(() => {});
    });
  },
};
