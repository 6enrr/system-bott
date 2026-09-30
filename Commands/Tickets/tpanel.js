const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Colors,
  PermissionsBitField,
} = require("discord.js");
const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

function panelsListKey(guildId) {
  return `ticket_panels_${guildId}`;
}
function panelKey(guildId, panelId) {
  return `ticket_panel_${guildId}_${panelId}`;
}

module.exports = {
  name: "tpanel",
  description: "تسوي اكثر من بانل تكت وتتحكم فيها",
  usage: [
    "tpanel list",
    "tpanel create <id> #channel",
    "tpanel show <id>",
    "tpanel send <id> #channel",
    "tpanel move <id> #channel",
    "tpanel delete <id>",
    "tpanel settext <id> <text...>",
    "tpanel setimage <id> <url او path>",
    "tpanel setplaceholder <id> <text...>",
    "tpanel setmsg <id> <msg...>",
    "tpanel setcat <id> <categoryId>",
    "tpanel setrole <id> <roleId>",
    "tpanel setlog <id> <channelId>",
  ],
  run: async (client, message, args) => {
    if (!message.guild) return;

    const isOwner = owners.includes(message.author.id);
    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
    if (!hasAllow(message, "ticket")) return message.reply("ما عندك صلاحية تستخدم اوامر التكتات");

    const sub = (args[0] || "").toLowerCase();
    const guildId = message.guild.id;

    const Color =
      db.get(`Guild_Color = ${guildId}`) ||
      message.guild.members.me?.displayHexColor ||
      Colors.Blurple;

    if (sub === "list") {
      const list = db.get(panelsListKey(guildId)) || [];
      if (!list.length) return message.reply("ما عندك بانلات للحين");
      return message.reply(`البانلات: ${list.map((x) => `\`${x}\``).join(", ")}`);
    }

    const panelId = (args[1] || "").toLowerCase();
    if (!panelId) return message.reply("اكتب id مثل: support او shop");

    const key = panelKey(guildId, panelId);

    if (sub === "create") {
      const ch = message.mentions.channels.first();
      if (!ch) return message.reply("منشن الروم اللي تبي تحط فيه البانل");
      if (db.get(key)) return message.reply("هالـ id مستخدم قبل");

      const panel = {
        id: panelId,
        text: "اضغط تحت واختر القسم",
        image: null,
        placeholder: "اختار من هنا",
        ticketMsg: null,     
        catId: null,         
        roleId: null,         
        logChannelId: null, 
        options: [],
        channelId: null,
        messageId: null,
      };

      db.set(key, panel);

      const listKey = panelsListKey(guildId);
      const list = db.get(listKey) || [];
      if (!list.includes(panelId)) {
        list.push(panelId);
        db.set(listKey, list);
      }

      return message.reply(`تم انشاء البانل \`${panelId}\` ، الحين زيد خيارات بـ: tmenu add ${panelId} ... وبعدها ارسلها بـ: tpanel send ${panelId} #channel`);
    }

    if (sub === "show") {
      const panel = db.get(key);
      if (!panel) return message.reply("هالبانل مو موجود");
      return message.reply(
        `بانل: \`${panelId}\`\n` +
        `الروم: ${panel.channelId ? `<#${panel.channelId}>` : "—"}\n` +
        `رساله: ${panel.messageId ? `\`${panel.messageId}\`` : "—"}\n` +
        `خيارات: ${(panel.options || []).length}`
      );
    }

    const panel = db.get(key);
    if (!panel) return message.reply("هالبانل مو موجود, سو tpanel create اول");

    if (sub === "settext") {
      const text = args.slice(2).join(" ").trim();
      if (!text) return message.reply("اكتب النص");
      panel.text = text;
      db.set(key, panel);
      return message.reply("تم");
    }

    if (sub === "setimage") {
      const img = args.slice(2).join(" ").trim();
      if (!img) return message.reply("حط رابط او مسار الصوره");
      panel.image = img;
      db.set(key, panel);
      return message.reply("تم");
    }

    if (sub === "setplaceholder") {
      const ph = args.slice(2).join(" ").trim();
      if (!ph) return message.reply("اكتب النص");
      panel.placeholder = ph;
      db.set(key, panel);
      return message.reply("تم");
    }

    if (sub === "setmsg") {
      const msg2 = args.slice(2).join(" ").trim();
      if (!msg2) return message.reply("اكتب رسالة التذكره");
      panel.ticketMsg = msg2;
      db.set(key, panel);
      return message.reply("تم");
    }

    if (sub === "setcat") {
      const catId = args[2];
      if (!catId) return message.reply("حط categoryId");
      panel.catId = catId;
      db.set(key, panel);
      return message.reply("تم");
    }

    if (sub === "setrole") {
      const roleId = args[2];
      if (!roleId) return message.reply("حط roleId");
      panel.roleId = roleId;
      db.set(key, panel);
      return message.reply("تم");
    }

    if (sub === "setlog") {
      const logId = args[2];
      if (!logId) return message.reply("حط channelId حق اللوق");
      panel.logChannelId = logId;
      db.set(key, panel);
      return message.reply("تم");
    }

    async function sendPanel(targetChannel) {
      const options = Array.isArray(panel.options) ? panel.options : [];
      if (!options.length) {
        return message.reply("زيد خيارات اول بـ tmenu add");
      }

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`M0:${panelId}`)
          .setPlaceholder(panel.placeholder || "اختار")
          .addOptions(options)
      );

      let sent;
      if (panel.text) {
        const embed = new EmbedBuilder().setColor(Color).setDescription(panel.text);
        if (panel.image) embed.setImage(panel.image);
        sent = await targetChannel.send({ embeds: [embed], components: [row] });
      } else if (panel.image) {
        sent = await targetChannel.send({ files: [panel.image], components: [row] }).catch(async () => {
          const embed = new EmbedBuilder().setColor(Color).setImage(panel.image);
          return targetChannel.send({ embeds: [embed], components: [row] });
        });
      } else {
        const embed = new EmbedBuilder().setColor(Color).setDescription("افتح تذكره من هنا");
        sent = await targetChannel.send({ embeds: [embed], components: [row] });
      }

      panel.channelId = targetChannel.id;
      panel.messageId = sent.id;
      db.set(key, panel);

      return sent;
    }

if (sub === "refresh") {
  const panel = db.get(key);
  if (!panel) return message.reply("هالبانل مو موجود");

  if (!panel.channelId || !panel.messageId) {
    return message.reply("هالبانل ما عنده رساله مسجله, استخدم tpanel send اول");
  }

  const ch = message.guild.channels.cache.get(panel.channelId);
  if (!ch) return message.reply("ما لقيت الروم اللي كانت فيه الرساله");

  const msg = await ch.messages.fetch(panel.messageId).catch(() => null);
  if (!msg) return message.reply("ما لقيت الرساله (يمكن محذوفه), استخدم tpanel send من جديد");

  const options = Array.isArray(panel.options) ? panel.options : [];
  if (!options.length) return message.reply("ما فيه خيارات, زيدها بـ tmenu add اول");

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`M0:${panelId}`)
      .setPlaceholder(panel.placeholder || "اختار")
      .addOptions(options)
  );

  let payload = { components: [row] };

  if (panel.text) {
    const embed = new EmbedBuilder().setColor(Color).setDescription(panel.text);
    if (panel.image) embed.setImage(panel.image);
    payload.embeds = [embed];
    payload.content = ""; 
    payload.files = [];   
  } else if (panel.image) {
    if (/^https?:\/\//i.test(panel.image)) {
      const embed = new EmbedBuilder().setColor(Color).setImage(panel.image);
      payload.embeds = [embed];
      payload.content = "";
      payload.files = [];
    } else {
      payload.content = " ";
      payload.embeds = [];
      payload.files = [panel.image];
    }
  } else {
    const embed = new EmbedBuilder().setColor(Color).setDescription("افتح تذكره من هنا");
    payload.embeds = [embed];
    payload.content = "";
    payload.files = [];
  }

  await msg.edit(payload).catch((e) => {
    console.error("refresh edit error:", e);
    return null;
  });

  return message.reply(`تم تحديث البانل \`${panelId}\` بنفس الرساله ✅`);
}

    if (sub === "send") {
      const ch = message.mentions.channels.first();
      if (!ch) return message.reply("منشن الروم");
      await sendPanel(ch);
      return message.reply(`تم ارسال البانل \`${panelId}\` في ${ch}`);
    }

    if (sub === "move") {
      const ch = message.mentions.channels.first();
      if (!ch) return message.reply("منشن الروم");

      if (panel.channelId && panel.messageId) {
        const oldCh = message.guild.channels.cache.get(panel.channelId);
        if (oldCh) {
          const oldMsg = await oldCh.messages.fetch(panel.messageId).catch(() => null);
          if (oldMsg) await oldMsg.delete().catch(() => null);
        }
      }

      await sendPanel(ch);
      return message.reply(`تم نقل البانل \`${panelId}\` الى ${ch}`);
    }

    if (sub === "delete") {
      if (panel.channelId && panel.messageId) {
        const oldCh = message.guild.channels.cache.get(panel.channelId);
        if (oldCh) {
          const oldMsg = await oldCh.messages.fetch(panel.messageId).catch(() => null);
          if (oldMsg) await oldMsg.delete().catch(() => null);
        }
      }

      db.delete(key);

      const listKey = panelsListKey(guildId);
      const list = db.get(listKey) || [];
      db.set(listKey, list.filter((x) => x !== panelId));

      return message.reply(`تم حذف البانل \`${panelId}\``);
    }

    return message.reply("استخدم: tpanel create/list/show/send/move/delete/settext/setimage/setplaceholder/setmsg/setcat/setrole/setlog");
  },
};