const fs = require("fs");
const path = require("path");
const {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const Data = require("pro.db");
const { createTranscript } = require("discord-html-transcripts");

function panelKey(guildId, panelId) {
  return `ticket_panel_${guildId}_${panelId}`;
}

module.exports = async (client, interaction) => {
  try {
    if (interaction.isStringSelectMenu() && (interaction.customId === "M0" || interaction.customId.startsWith("M0:"))) {
      const guild = interaction.guild;
      const member = interaction.member;
      if (!guild || !member) {
        return interaction.reply({ content: "ما قدرت احدد السيرفر او العضو", ephemeral: true });
      }

      const panelId = interaction.customId.includes(":") ? interaction.customId.split(":")[1] : "default";

      const panel = Data.get(panelKey(guild.id, panelId)) || null;

      const roleId = (panel && panel.roleId) ? panel.roleId : Data.get(`Role = [${guild.id}]`);
      const catId = (panel && panel.catId) ? panel.catId : Data.get(`Cat = [${guild.id}]`);
      const logChannelId = (panel && panel.logChannelId) ? panel.logChannelId : Data.get(`Channel = [${guild.id}]`);
      const imagePath = (panel && panel.image) ? panel.image : Data.get(`Image = [${guild.id}]`);

      const savedMsg =
        (panel && panel.ticketMsg) ||
        Data.get(`ticket_message_${guild.id}`) ||
        "اكتب مشكلتك هنا وبيجيك الدعم باسرع وقت";

      const menuOptions = (panel && Array.isArray(panel.options) && panel.options.length)
        ? panel.options
        : (Data.get(`menuOptions_${guild.id}`) || []);

      const existing = Data.get(`member${member.id}`);
      if (existing) {
        const existingCh = guild.channels.cache.get(existing);
        if (existingCh) {
          return interaction.reply({ content: `عندك تذكره مفتوحه: ${existingCh}`, ephemeral: true });
        } else {
          Data.delete(`member${member.id}`);
        }
      }

      const choiceValue = interaction.values[0];
      const optionEntry =
        menuOptions.find((o) => o.value === choiceValue) ||
        { label: choiceValue, description: null };

      const baseName = `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9\-]/g, "")}`.slice(0, 60);
      let channelName = baseName;
      let suffix = 1;
      while (guild.channels.cache.some((c) => c.name === channelName)) {
        channelName = `${baseName}-${suffix++}`;
        if (suffix > 50) break;
      }

      const overwrites = [
        { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        {
          id: member.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.EmbedLinks,
          ],
        },
        {
          id: guild.members.me.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        },
      ];

      if (roleId) {
        const role = guild.roles.cache.get(roleId);
        if (role) {
          overwrites.push({
            id: role.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageMessages,
              PermissionsBitField.Flags.ManageChannels,
            ],
          });
        }
      }

      const createOptions = {
        type: ChannelType.GuildText,
        permissionOverwrites: overwrites,
        reason: `Ticket opened by ${member.user.tag}`,
      };
      if (catId && guild.channels.cache.get(catId)) createOptions.parent = catId;

      const ticketChannel = await guild.channels.create({
        name: channelName,
        ...createOptions,
      });

      Data.set(`channel${ticketChannel.id}`, member.id);
      Data.set(`member${member.id}`, ticketChannel.id);

      Data.set(`ticket_panel_used_${ticketChannel.id}`, panelId);

      const embed = new EmbedBuilder()
        .setTitle("تذكرتك")
        .setDescription(`هلا <@${member.id}>\n\n${savedMsg}`)
        .setColor(0x00ae86);

      const filesOption = [];
      if (imagePath) {
        if (/^https?:\/\//i.test(imagePath)) {
          embed.setImage(imagePath);
        } else {
          const filename = path.basename(imagePath);
          if (fs.existsSync(imagePath)) {
            embed.setImage(`attachment://${filename}`);
            filesOption.push({ attachment: imagePath, name: filename });
          }
        }
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_claim").setLabel("Claim").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("ticket_close").setLabel("Close").setStyle(ButtonStyle.Danger)
      );

      const sendPayload = { content: `<@${member.id}>`, embeds: [embed], components: [row] };
      if (filesOption.length) sendPayload.files = filesOption;

      await ticketChannel.send(sendPayload);
      await interaction.reply({ content: `تم فتح تذكرتك: ${ticketChannel}`, ephemeral: true });

      if (logChannelId) {
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("تم فتح تذكره")
            .addFields(
              { name: "المستخدم", value: `<@${member.id}>`, inline: true },
              { name: "القناه", value: `${ticketChannel}`, inline: true },
              { name: "القسم", value: `${optionEntry.label || choiceValue}`, inline: true },
              { name: "البانل", value: `\`${panelId}\``, inline: true }
            )
            .setTimestamp()
            .setColor(0x00ae86);

          logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }

      return;
    }

    if (interaction.isButton()) {
      const id = interaction.customId;
      if (id !== "ticket_claim" && id !== "ticket_close") return;

      const channel = interaction.channel;
      const guild = interaction.guild;
      if (!channel || !guild) {
        return interaction.reply({ content: "لازم تكون داخل روم التذكره", ephemeral: true });
      }

      const ticketOwnerId = Data.get(`channel${channel.id}`);
      if (!ticketOwnerId) return interaction.reply({ content: "هذي مو تذكره او بياناتها انحذفت", ephemeral: true });

      const roleId = Data.get(`Role = [${guild.id}]`);
      const { owners } = require(`${process.cwd()}/config`);
      const isOwner = owners.includes(interaction.user.id);
      const hasSupportRole = roleId && guild.members.cache.get(interaction.user.id)?.roles.cache.has(roleId);

      if (id === "ticket_claim") {
        if (!isOwner && !hasSupportRole) return interaction.reply({ content: "ما عندك صلاحية تستلم", ephemeral: true });

        const claimKey = `claim${channel.id}`;
        const already = Data.get(claimKey);
        if (already) return interaction.reply({ content: `مستلمه من <@${already}>`, ephemeral: true });

        Data.set(claimKey, interaction.user.id);
        await interaction.reply({ content: `تم استلام التذكره بواسطة <@${interaction.user.id}> ✅`, ephemeral: false }).catch(() => {});
        return;
      }

      if (id === "ticket_close") {
        if (!isOwner && !hasSupportRole) return interaction.reply({ content: "ما عندك صلاحية تقفل", ephemeral: true });

        await interaction.reply({ content: "جاري الاغلاق...", ephemeral: true });

        try {
          const memberId = Data.get(`channel${channel.id}`);
          const member = await guild.members.fetch(memberId).catch(() => null);

          const transcript = await createTranscript(channel, {
            returnType: "buffer",
            minify: true,
            saveImages: true,
            useCDN: true,
            poweredBy: false,
            fileName: `${channel.name}.html`,
          });

          const logChannelId = Data.get(`Channel = [${guild.id}]`);
          const logChannel = guild.channels.cache.get(logChannelId);
          const claimId = Data.get(`claim${channel.id}`);

          if (logChannel) {
            const embed = new EmbedBuilder()
              .setTitle("تم اغلاق التذكره")
              .addFields(
                { name: "التذكره", value: channel.name, inline: true },
                { name: "اغلقها", value: `<@${interaction.user.id}>`, inline: true },
                { name: "صاحب التذكره", value: member ? `<@${member.id}>` : "غير معروف", inline: true }
              )
              .setTimestamp();

            if (claimId) embed.addFields({ name: "المستلم", value: `<@${claimId}>`, inline: true });

            await logChannel.send({
              embeds: [embed],
              files: [{ attachment: transcript, name: `${channel.name}.html` }],
            }).catch(() => {});
          }

          try {
            const chKey = `channel${channel.id}`;
            if (Data.has(chKey)) Data.delete(chKey);

            if (member) {
              const memberKey = `member${member.id}`;
              if (Data.has(memberKey)) Data.delete(memberKey);
            }

            const claimKey = `claim${channel.id}`;
            if (Data.has(claimKey)) Data.delete(claimKey);

            const pKey = `ticket_panel_used_${channel.id}`;
            if (Data.has(pKey)) Data.delete(pKey);
          } catch (err) {
            console.error("cleanup error:", err);
          }

          setTimeout(async () => {
            await channel.delete().catch(() => {});
          }, 1000);
        } catch (error) {
          console.error("ticket close error:", error);
          return interaction.followUp({ content: "صار خطا وقت الاغلاق", ephemeral: true });
        }
        return;
      }
    }
  } catch (err) {
    console.error("interactionCreate handler error:", err);
  }
};