const { PermissionsBitField } = require("discord.js");
const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

function panelKey(guildId, panelId) {
  return `ticket_panel_${guildId}_${panelId}`;
}

function parseEmoji(input) {
  if (!input) return undefined;
  const raw = String(input).trim();
  if (!raw) return undefined;

  const m = raw.match(/^<a?:([a-zA-Z0-9_]+):(\d+)>$/);
  if (m) {
    return {
      name: m[1],
      id: m[2],
      animated: raw.startsWith("<a:"),
    };
  }

  return { name: raw };
}

module.exports = {
  name: "tmenu",
  description: "تتحكم بخيارات القايمه لبانل معين + يدعم ايموجي",
  usage: [
    "tmenu list <panelId>",
    "tmenu add <panelId> <label> | <value> | <desc اختياري> | <emoji اختياري>",
    "tmenu remove <panelId> <value>",
    "tmenu clear <panelId>",
  ],
  run: async (client, message, args) => {
    if (!message.guild) return;

    const isOwner = owners.includes(message.author.id);
    const isAdmin = message.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    );
    if (!isOwner && !isAdmin) return message.reply("ما تقدر تستخدم الامر هذا");

    const sub = (args[0] || "").toLowerCase();
    const panelId = (args[1] || "").toLowerCase();
    if (!panelId) return message.reply("اكتب panelId");

    const key = panelKey(message.guild.id, panelId);
    const panel = db.get(key);
    if (!panel) return message.reply("هالبانل مو موجود, سو tpanel create اول");

    panel.options = Array.isArray(panel.options) ? panel.options : [];

    if (sub === "list") {
      if (!panel.options.length) return message.reply("ما فيه خيارات للحين");

      const txt = panel.options
        .map((o, i) => {
          const emojiTxt = o.emoji?.id
            ? `<${o.emoji.animated ? "a" : ""}:${o.emoji.name}:${o.emoji.id}> `
            : o.emoji?.name
            ? `${o.emoji.name} `
            : "";
          return `${i + 1}) ${emojiTxt}${o.label} | ${o.value}${
            o.description ? ` | ${o.description}` : ""
          }`;
        })
        .join("\n");

      return message.reply(`خيارات \`${panelId}\`:\n${txt}`);
    }

    if (sub === "add") {
      const raw = args.slice(2).join(" ").trim();
      const parts = raw
        .split("|")
        .map((x) => x.trim())
        .filter((x) => x.length);

      const label = parts[0];
      const value = parts[1];
      const description = parts[2] || undefined;
      const emojiRaw = parts[3] || undefined;

      if (!label || !value)
        return message.reply(
          "اكتب كذا: tmenu add support دعم فني | tech | وصف اختياري | 🛠️"
        );

      if (panel.options.some((o) => o.value === value))
        return message.reply("value مستخدم قبل, غيره");

      const opt = { label, value };

      if (description) opt.description = description;

      const emoji = parseEmoji(emojiRaw);
      if (emoji) opt.emoji = emoji;

      panel.options.push(opt);
      db.set(key, panel);

      return message.reply(
        `تمت الاضافه ✅\n` +
          `عشان يبان بالرساله اكتب: tpanel send ${panelId} #الروم (او move)`
      );
    }

    if (sub === "remove") {
      const value = (args[2] || "").trim();
      if (!value) return message.reply("اكتب value اللي تبي تحذفه");

      const before = panel.options.length;
      panel.options = panel.options.filter((o) => o.value !== value);
      db.set(key, panel);

      if (panel.options.length === before) return message.reply("ما لقيت هالقيمه");

      return message.reply(
        `تم الحذف ✅\n` +
          `عشان يبان بالرساله اكتب: tpanel send ${panelId} #الروم (او move)`
      );
    }

    if (sub === "clear") {
      panel.options = [];
      db.set(key, panel);

      return message.reply(
        `تم مسح الخيارات ✅\n` +
          `عشان يبان بالرساله اكتب: tpanel send ${panelId} #الروم (او move)`
      );
    }

    return message.reply("استخدم: tmenu list/add/remove/clear");
  },
};