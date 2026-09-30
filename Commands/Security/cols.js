const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "cols",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const Color = db.get(`Guild_Color_${message.guild.id}`) || "#5c5e64";

    if (!args[0]) {
      const allData = db.all();
      const allCollections = allData
        .map((item) => item[0].split(" = ")[1])
        .filter((key) => key && key.startsWith("collection_"));

      if (allCollections.length === 0) {
        return message.reply("لا يوجد أي مجموعات. قم بإنشاء مجموعة باستخدام `-col <اسم>`");
      }
      if (allCollections.length > 25) {
        return message.reply("تم الوصول إلى الحد الأقصى لعدد المجموعات (25 مجموعة).");
      }

      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          "**يرجى إرفاق اسم الكوليكشن مع الامر**\n" +
            allCollections
              .map((name, index) => `${index + 1}. ${name.replace("collection_", "")}`)
              .join("\n")
        );

      await message.channel.send({ embeds: [embed] });
      return;
    }

    const collectionName = args[0];
    await showCollectionPanel(client, collectionName, message, null, Color);
  },
};

async function showCollectionPanel(client, collectionName, message, interaction, Color) {
  let collection = db.get(`collection_${collectionName}`);
  if (!collection) {
    collection = { allowedUsers: [], allowedRoles: [], rolesToRemove: [], enabled: false };
    db.set(`collection_${collectionName}`, collection);
  }

  const embed = new EmbedBuilder()
    .setTitle(`المجموعة: ${collectionName}`)
    .addFields(
      {
        name: "الأعضاء المسموح بهم",
        value: collection.allowedUsers.length ? collection.allowedUsers.map((id) => `<@${id}>`).join("\n") : "لا يوجد",
        inline: true,
      },
      {
        name: "الرولات المسموح بها",
        value: collection.allowedRoles.length ? collection.allowedRoles.map((id) => `<@&${id}>`).join("\n") : "لا يوجد",
        inline: true,
      },
      {
        name: "الرولات الممنوعة",
        value: collection.rolesToRemove.length ? collection.rolesToRemove.map((id) => `<@&${id}>`).join("\n") : "لا يوجد",
        inline: true,
      },
      { name: "قابل للإزالة", value: collection.enabled ? "مفعل" : "معطل", inline: true }
    )
    .setColor(Color);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("allowed_users").setLabel("الأعضاء المسموح بهم").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("allowed_roles").setLabel("الرولات المسموح بها").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("roles_to_remove").setLabel("الرولات الممنوعة").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("on_off").setLabel("قابل للإزالة").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("remove_collection").setLabel("إزالة المجموعة").setStyle(ButtonStyle.Danger)
  );

  const panelMessage = interaction
    ? await interaction.channel.send({ embeds: [embed], components: [row], fetchReply: true })
    : await message.channel.send({ embeds: [embed], components: [row] });

  const filter = (btn) => btn.user.id === message.author.id;
  const collector = panelMessage.createMessageComponentCollector({ filter, time: 60000 });

  collector.on("collect", async (btn) => {
    await btn.deferUpdate().catch(() => {});

    const askOnce = async (promptText, mapFn) => {
      const m = await message.reply(promptText);
      const col = message.channel.createMessageCollector({
        filter: (mm) => mm.author.id === message.author.id,
        time: 15000,
      });
      col.on("collect", async (res) => {
        try {
          await mapFn(res);
        } finally {
          await m.delete().catch(() => {});
          col.stop();
          panelMessage.edit({ embeds: [await updateEmbedFunc(collectionName, collection, Color)] });
        }
      });
    };

    if (btn.customId === "allowed_users") {
      await askOnce("يرجى ارفاق منشن/آي دي العضو الآن.", async (msg) => {
        const ids = msg.content.split(" ").map((id) => id.trim().replace(/[<@!>]/g, ""));
        const added = [];
        const removed = [];
        for (const id of ids) {
          const user = await client.users.fetch(id).catch(() => null);
          if (!user) continue;
          if (!collection.allowedUsers.includes(id)) {
            collection.allowedUsers.push(id);
            added.push(id);
          } else {
            collection.allowedUsers = collection.allowedUsers.filter((x) => x !== id);
            removed.push(id);
          }
        }
        db.set(`collection_${collectionName}`, collection);
        const desc =
          (added.length ? added.map((id) => `✅ <@${id}>`).join("\n") + "\n" : "") +
          (removed.length ? removed.map((id) => `☑️ <@${id}>`).join("\n") + "\n" : "");
        if (desc) await btn.followUp({ content: desc, ephemeral: true });
      });
    }

    if (btn.customId === "allowed_roles") {
      await askOnce("يرجى ارفاق منشن/آي دي الرول الآن.", async (msg) => {
        const ids = msg.content.split(" ").map((id) => id.trim().replace(/[<@&>]/g, ""));
        const added = [];
        const removed = [];
        for (const id of ids) {
          const role = message.guild.roles.cache.get(id);
          if (!role) continue;
          if (!collection.allowedRoles.includes(id)) {
            collection.allowedRoles.push(id);
            added.push(id);
          } else {
            collection.allowedRoles = collection.allowedRoles.filter((x) => x !== id);
            removed.push(id);
          }
        }
        db.set(`collection_${collectionName}`, collection);
        const desc =
          (added.length ? added.map((id) => `✅ <@&${id}>`).join("\n") + "\n" : "") +
          (removed.length ? removed.map((id) => `☑️ <@&${id}>`).join("\n") + "\n" : "");
        if (desc) await btn.followUp({ content: desc, ephemeral: true });
      });
    }

    if (btn.customId === "roles_to_remove") {
      await askOnce("يرجى ارفاق منشن/آي دي الرول الآن.", async (msg) => {
        const ids = msg.content.split(" ").map((id) => id.trim().replace(/[<@&>]/g, ""));
        const added = [];
        const removed = [];
        for (const id of ids) {
          const role = message.guild.roles.cache.get(id);
          if (!role) continue;
          if (!collection.rolesToRemove.includes(id)) {
            collection.rolesToRemove.push(id);
            added.push(id);
          } else {
            collection.rolesToRemove = collection.rolesToRemove.filter((x) => x !== id);
            removed.push(id);
          }
        }
        db.set(`collection_${collectionName}`, collection);
        const desc =
          (added.length ? added.map((id) => `✅ <@&${id}>`).join("\n") + "\n" : "") +
          (removed.length ? removed.map((id) => `☑️ <@&${id}>`).join("\n") + "\n" : "");
        if (desc) await btn.followUp({ content: desc, ephemeral: true });
      });
    }

    if (btn.customId === "on_off") {
      collection.enabled = !collection.enabled;
      db.set(`collection_${collectionName}`, collection);
      await btn.followUp({ content: `المجموعة الآن ${collection.enabled ? "مفعلة" : "معطلة"}.`, ephemeral: true });
      await panelMessage.edit({ embeds: [await updateEmbedFunc(collectionName, collection, Color)] });
    }

    if (btn.customId === "remove_collection") {
      db.delete(`collection_${collectionName}`);
      await btn.followUp({ content: `تمت إزالة المجموعة ${collectionName}.`, ephemeral: true });
      await panelMessage.delete().catch(() => {});
    }
  });
}

async function updateEmbedFunc(collectionName, collection, Color) {
  return new EmbedBuilder()
    .setTitle(`المجموعة: ${collectionName}`)
    .addFields(
      {
        name: "الأعضاء المسموح بهم",
        value: collection.allowedUsers.length ? collection.allowedUsers.map((id) => `<@${id}>`).join("\n") : "لا يوجد",
        inline: true,
      },
      {
        name: "الرولات المسموح بها",
        value: collection.allowedRoles.length ? collection.allowedRoles.map((id) => `<@&${id}>`).join("\n") : "لا يوجد",
        inline: true,
      },
      {
        name: "الرولات الممنوعة",
        value: collection.rolesToRemove.length ? collection.rolesToRemove.map((id) => `<@&${id}>`).join("\n") : "لا يوجد",
        inline: true,
      },
      { name: "قابل للإزالة", value: collection.enabled ? "مفعل" : "معطل", inline: true }
    )
    .setColor(Color);
}
