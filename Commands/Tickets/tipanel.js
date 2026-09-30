const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Colors,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const Pro = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);


function panelsListKey(guildId) {
  return `ticket_panels_${guildId}`;
}
function panelKey(guildId, panelId) {
  return `ticket_panel_${guildId}_${panelId}`;
}

function parseEmoji(input) {
  if (!input) return undefined;
  const raw = String(input).trim();
  if (!raw) return undefined;

  const m = raw.match(/^<a?:([a-zA-Z0-9_]+):(\d+)>$/);
  if (m) {
    return { name: m[1], id: m[2], animated: raw.startsWith("<a:") };
  }
  return { name: raw };
}

function emojiToText(emoji) {
  if (!emoji) return "";
  if (typeof emoji === "string") return `${emoji} `; 
  if (emoji.id) return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}> `;
  if (emoji.name) return `${emoji.name} `;
  return "";
}

async function askText(message, prompt, time = 60_000) {
  const ask = await message.reply(prompt);
  const c = message.channel.createMessageCollector({
    filter: (m) => m.author.id === message.author.id,
    max: 1,
    time,
  });

  const res = await new Promise((resolve) => {
    c.on("collect", (m) => resolve(m));
    c.on("end", (collected) => {
      if (!collected.size) resolve(null);
    });
  });

  if (!res) {
    await ask.edit("انتهى الوقت");
    return null;
  }
  return res;
}

async function sendPanelMessage(guild, panelId, panel, targetChannel) {
  const Color =
    Pro.get(`Guild_Color = ${guild.id}`) ||
    guild.members.me?.displayHexColor ||
    Colors.Blurple;

  const options = Array.isArray(panel.options) ? panel.options : [];
  if (!options.length) throw new Error("NO_OPTIONS");

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`M0:${panelId}`)
      .setPlaceholder(panel.placeholder || "اختار القسم")
      .addOptions(options)
  );

  let sent;
  if (panel.text) {
    const embed = new EmbedBuilder().setColor(Color).setDescription(panel.text);
    if (panel.image) embed.setImage(panel.image);
    sent = await targetChannel.send({ embeds: [embed], components: [row] });
  } else if (panel.image) {
    if (/^https?:\/\//i.test(panel.image)) {
      const embed = new EmbedBuilder().setColor(Color).setImage(panel.image);
      sent = await targetChannel.send({ embeds: [embed], components: [row] });
    } else {
      sent = await targetChannel.send({ files: [panel.image], components: [row] }).catch(async () => {
        const embed = new EmbedBuilder().setColor(Color).setDescription("افتح تذكره من هنا");
        return targetChannel.send({ embeds: [embed], components: [row] });
      });
    }
  } else {
    const embed = new EmbedBuilder().setColor(Color).setDescription("افتح تذكره من هنا");
    sent = await targetChannel.send({ embeds: [embed], components: [row] });
  }

  panel.channelId = targetChannel.id;
  panel.messageId = sent.id;
  Pro.set(panelKey(guild.id, panelId), panel);

  const listKey = panelsListKey(guild.id);
  const list = Pro.get(listKey) || [];
  if (!list.includes(panelId)) {
    list.push(panelId);
    Pro.set(listKey, list);
  }

  return sent;
}

async function deleteOldPanelMessage(guild, panel) {
  if (!panel?.channelId || !panel?.messageId) return;
  const ch = guild.channels.cache.get(panel.channelId);
  if (!ch) return;
  const msg = await ch.messages.fetch(panel.messageId).catch(() => null);
  if (msg) await msg.delete().catch(() => {});
}

module.exports = {
  name: "tipanel",
  description: "لوحة التكتات (بانلات كثيرة + قوائم + ايموجي)",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const mainRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("tiMain")
        .setPlaceholder("اختار وش تبي تسوي")
        .addOptions(
          { label: "بانلات - انشاء بانل جديد", value: "panel_create" },
          { label: "بانلات - تعديل بانل موجود", value: "panel_edit" },
          { label: "بانلات - قائمة البانلات", value: "panel_list" },
          { label: "اعدادات عامه (احتياط)", value: "global_settings" },
          { label: "تصفير كامل", value: "reset_all" }
        )
    );

    const cancelRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("tiCancel").setLabel("الغاء").setStyle(ButtonStyle.Danger)
    );

    const panelMsg = await message.reply({
      content: "لوحة التكتات الجديدة",
      components: [mainRow, cancelRow],
    });

    const collector = panelMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 120_000,
    });

    collector.on("collect", async (i) => {
      try {
        if (i.customId === "tiCancel") {
          collector.stop();
          return i.message.delete().catch(() => {});
        }

        if (!i.isStringSelectMenu()) return;
        await i.deferUpdate();

        const val = i.values[0];

        if (val === "panel_create") {
          await panelMsg.delete().catch(() => {});

          const idMsg = await askText(message, "اكتب اسم البانل (مثال: support او shop)");
          if (!idMsg) return;

          const panelId = idMsg.content.trim().toLowerCase().replace(/\s+/g, "-");
          if (!panelId) return message.reply("اسم غلط");

          const key = panelKey(message.guild.id, panelId);
          if (Pro.get(key)) return message.reply("هذا البانل موجود قبل");

          const chMsg = await askText(message, "منشن الروم اللي تبي ترسل فيه البانل (مثال: #support)");
          if (!chMsg) return;

          const targetChannel = chMsg.mentions.channels.first();
          if (!targetChannel) return message.reply("منشن روم صح");

          const panel = {
            id: panelId,
            text: "اضغط تحت واختر القسم",
            image: null,
            placeholder: "اختار القسم",
            ticketMsg: null,
            catId: null,
            roleId: null,
            logChannelId: null,
            options: [],
            channelId: null,
            messageId: null,
          };

          Pro.set(key, panel);

          const listKey = panelsListKey(message.guild.id);
          const list = Pro.get(listKey) || [];
          if (!list.includes(panelId)) {
            list.push(panelId);
            Pro.set(listKey, list);
          }

          return message.reply(
            `تم انشاء البانل \`${panelId}\`\n` +
              `الحين زيد خيارات بـ:\n` +
              `tmenu add ${panelId} اسم | value | وصف | ايموجي\n` +
              `وبعدين ارسله بـ:\n` +
              `tpanel send ${panelId} ${targetChannel}`
          );
        }

        if (val === "panel_list") {
          await panelMsg.delete().catch(() => {});

          const list = Pro.get(panelsListKey(message.guild.id)) || [];
          if (!list.length) return message.reply("ما عندك بانلات للحين");

          const lines = list.map((p) => `- \`${p}\``).join("\n");
          return message.reply(`البانلات:\n${lines}\n\nمثال:\ntpanel show support`);
        }

        if (val === "panel_edit") {
          await panelMsg.delete().catch(() => {});

          const idMsg = await askText(message, "اكتب اسم البانل اللي تبي تعدله (panelId)");
          if (!idMsg) return;

          const panelId = idMsg.content.trim().toLowerCase();
          const key = panelKey(message.guild.id, panelId);
          const panel = Pro.get(key);
          if (!panel) return message.reply("هذا البانل مو موجود, استخدم tpanel list وشوف الاسماء");

          const editRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("tiEdit")
              .setPlaceholder(`تعديل بانل: ${panelId}`)
              .addOptions(
                { label: "تعديل نص الايمبد", value: "set_text" },
                { label: "تعديل صورة البانل", value: "set_image" },
                { label: "تعديل placeholder", value: "set_placeholder" },
                { label: "تعديل رسالة داخل التذكره", value: "set_ticketmsg" },
                { label: "تحديد كاتجوري خاص للبانل", value: "set_cat" },
                { label: "تحديد رول خاص للبانل", value: "set_role" },
                { label: "تحديد لوق خاص للبانل", value: "set_log" },
                { label: "عرض خيارات القائمة", value: "opt_list" },
                { label: "اضافة خيار للقائمة", value: "opt_add" },
                { label: "حذف خيار من القائمة", value: "opt_remove" },
                { label: "مسح خيارات القائمة", value: "opt_clear" },
                { label: "ارسال البانل (يرسل رسالة جديدة)", value: "panel_send" },
                { label: "نقل البانل (يحذف القديم ويرسل جديد)", value: "panel_move" },
                { label: "حذف رسالة البانل فقط", value: "panel_msg_delete" },
                { label: "حذف البانل نهائي", value: "panel_delete" }
              )
          );

          const backRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("tiBack").setLabel("رجوع").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("tiCancel2").setLabel("الغاء").setStyle(ButtonStyle.Danger)
          );

          const editMsg = await message.reply({
            content: `تعديل بانل: \`${panelId}\``,
            components: [editRow, backRow],
          });

          const editCollector = editMsg.createMessageComponentCollector({
            filter: (x) => x.user.id === message.author.id,
            time: 180_000,
          });

          editCollector.on("collect", async (x) => {
            try {
              if (x.customId === "tiCancel2") {
                editCollector.stop();
                return editMsg.delete().catch(() => {});
              }
              if (x.customId === "tiBack") {
                editCollector.stop();
                return message.reply("اكتب tipanel مره ثانيه");
              }
              if (!x.isStringSelectMenu()) return;
              await x.deferUpdate();

              const act = x.values[0];

              if (act === "set_text") {
                const t = await askText(message, "اكتب النص الجديد للايمبد");
                if (!t) return;
                panel.text = t.content;
                Pro.set(key, panel);
                return message.reply("تم");
              }

              if (act === "set_image") {
                const t = await askText(message, "ارسل رابط الصوره او ارفق صوره (او اكتب none لحذفها)");
                if (!t) return;

                const att = t.attachments.first()?.url;
                const raw = (att || t.content.trim());
                if (raw.toLowerCase() === "none") {
                  panel.image = null;
                } else {
                  panel.image = raw;
                }
                Pro.set(key, panel);
                return message.reply("تم");
              }

              if (act === "set_placeholder") {
                const t = await askText(message, "اكتب placeholder (النص اللي يطلع فوق القايمه)");
                if (!t) return;
                panel.placeholder = t.content.trim();
                Pro.set(key, panel);
                return message.reply("تم");
              }

              if (act === "set_ticketmsg") {
                const t = await askText(message, "اكتب الرساله اللي تطلع داخل التذكره (او اكتب none عشان يرجع للعام)");
                if (!t) return;
                const raw = t.content.trim();
                panel.ticketMsg = raw.toLowerCase() === "none" ? null : raw;
                Pro.set(key, panel);
                return message.reply("تم");
              }

              if (act === "set_cat") {
                const t = await askText(message, "ارسل ايدي الكاتجوري (او none عشان يرجع للعام)");
                if (!t) return;
                const raw = t.content.trim();
                if (raw.toLowerCase() === "none") {
                  panel.catId = null;
                  Pro.set(key, panel);
                  return message.reply("تم");
                }
                const ch = message.guild.channels.cache.get(raw);
                if (!ch || ch.type !== ChannelType.GuildCategory) return message.reply("ايدي كاتجوري غلط");
                panel.catId = raw;
                Pro.set(key, panel);
                return message.reply("تم");
              }

              if (act === "set_role") {
                const t = await askText(message, "منشن الرول او ايدي الرول (او none)");
                if (!t) return;

                const raw = t.content.trim();
                if (raw.toLowerCase() === "none") {
                  panel.roleId = null;
                  Pro.set(key, panel);
                  return message.reply("تم");
                }

                const r = t.mentions.roles.first() || message.guild.roles.cache.get(raw.replace(/\D/g, ""));
                if (!r) return message.reply("رول غلط");
                panel.roleId = r.id;
                Pro.set(key, panel);
                return message.reply("تم");
              }

              if (act === "set_log") {
                const t = await askText(message, "منشن روم اللوق او ايدي الروم (او none)");
                if (!t) return;

                const raw = t.content.trim();
                if (raw.toLowerCase() === "none") {
                  panel.logChannelId = null;
                  Pro.set(key, panel);
                  return message.reply("تم");
                }

                const ch = t.mentions.channels.first() || message.guild.channels.cache.get(raw.replace(/\D/g, ""));
                if (!ch) return message.reply("روم غلط");
                panel.logChannelId = ch.id;
                Pro.set(key, panel);
                return message.reply("تم");
              }

              if (act === "opt_list") {
                const opts = Array.isArray(panel.options) ? panel.options : [];
                if (!opts.length) return message.reply("ما فيه خيارات");

                const txt = opts
                  .map((o, idx) => `${idx + 1}) ${emojiToText(o.emoji)}${o.label} | ${o.value}${o.description ? ` | ${o.description}` : ""}`)
                  .join("\n");
                return message.reply(`خيارات \`${panelId}\`:\n${txt}`);
              }

              if (act === "opt_add") {
                const t = await askText(
                  message,
                  "اكتب الخيار كذا:\nاسم | value | وصف اختياري | ايموجي اختياري\nمثال:\nدعم فني | tech | مشاكل عامه | 🛠️\nاو ايموجي خاص:\nمتجر | shop | شراء | <:shop:123456789012345678>"
                );
                if (!t) return;

                const parts = t.content.split("|").map((x) => x.trim()).filter(Boolean);
                const label = parts[0];
                const value = parts[1];
                const description = parts[2] || undefined;
                const emojiRaw = parts[3] || undefined;

                if (!label || !value) return message.reply("لازم اسم و value");
                panel.options = Array.isArray(panel.options) ? panel.options : [];
                if (panel.options.some((o) => o.value === value)) return message.reply("value مستخدم قبل");

                const opt = { label, value };
                if (description) opt.description = description;

                const emoji = parseEmoji(emojiRaw);
                if (emoji) opt.emoji = emoji;

                if (panel.options.length >= 25) return message.reply("وصلت الحد الاقصى 25 خيار");

                panel.options.push(opt);
                Pro.set(key, panel);

                return message.reply("تمت الاضافه ✅\nاذا تبي يبان بالرساله: tpanel send/move");
              }

              if (act === "opt_remove") {
                const t = await askText(message, "اكتب value اللي تبي تحذفه (مثال: tech)");
                if (!t) return;

                const value = t.content.trim();
                const before = (panel.options || []).length;
                panel.options = (panel.options || []).filter((o) => o.value !== value);
                Pro.set(key, panel);

                if (panel.options.length === before) return message.reply("ما لقيت هالقيمه");
                return message.reply("تم الحذف ✅\nاذا تبي يبان بالرساله: tpanel send/move");
              }

              if (act === "opt_clear") {
                panel.options = [];
                Pro.set(key, panel);
                return message.reply("تم مسح الخيارات ✅");
              }

              if (act === "panel_send") {
                const t = await askText(message, "منشن الروم اللي تبي ترسل فيه البانل");
                if (!t) return;
                const ch = t.mentions.channels.first();
                if (!ch) return message.reply("منشن روم صح");

                try {
                  await sendPanelMessage(message.guild, panelId, panel, ch);
                  return message.reply(`تم ارسال البانل \`${panelId}\` في ${ch}`);
                } catch (e) {
                  if (String(e.message) === "NO_OPTIONS") return message.reply("زيد خيارات اول");
                  return message.reply("صار خطا وانا ارسل");
                }
              }

              if (act === "panel_move") {
                const t = await askText(message, "منشن الروم اللي تبي تنقل له البانل");
                if (!t) return;
                const ch = t.mentions.channels.first();
                if (!ch) return message.reply("منشن روم صح");

                await deleteOldPanelMessage(message.guild, panel);
                panel.channelId = null;
                panel.messageId = null;
                Pro.set(key, panel);

                try {
                  await sendPanelMessage(message.guild, panelId, panel, ch);
                  return message.reply(`تم نقل البانل \`${panelId}\` الى ${ch}`);
                } catch (e) {
                  if (String(e.message) === "NO_OPTIONS") return message.reply("زيد خيارات اول");
                  return message.reply("صار خطا وانا انقل");
                }
              }

              if (act === "panel_msg_delete") {
                await deleteOldPanelMessage(message.guild, panel);
                panel.channelId = null;
                panel.messageId = null;
                Pro.set(key, panel);
                return message.reply("تم حذف رسالة البانل");
              }

              if (act === "panel_delete") {
                await deleteOldPanelMessage(message.guild, panel);

                Pro.delete(key);
                const listKey = panelsListKey(message.guild.id);
                const list = Pro.get(listKey) || [];
                Pro.set(listKey, list.filter((x2) => x2 !== panelId));

                return message.reply(`تم حذف البانل \`${panelId}\``);
              }
            } catch (err) {
              console.error("tipanel edit error:", err);
              return message.reply("صار خطا");
            }
          });

          editCollector.on("end", async () => {
          });

          return;
        }

        if (val === "global_settings") {
          await panelMsg.delete().catch(() => {});

          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("tiGlobal")
              .setPlaceholder("اعدادات عامه")
              .addOptions(
                { label: "تحديد صورة افتراضيه", value: "g_image" },
                { label: "تحديد رول الدعم افتراضي", value: "g_role" },
                { label: "تحديد روم اللوق افتراضي", value: "g_log" },
                { label: "تحديد كاتجوري افتراضي", value: "g_cat" },
                { label: "تحديد رسالة داخل التذكره افتراضيه", value: "g_ticketmsg" }
              )
          );

          const msg2 = await message.reply({
            content: "اعدادات عامه (تشتغل اذا البانل ما له اعدادات خاصه)",
            components: [row, cancelRow],
          });

          const c2 = msg2.createMessageComponentCollector({
            filter: (x) => x.user.id === message.author.id,
            time: 120_000,
          });

          c2.on("collect", async (x) => {
            try {
              if (x.customId === "tiCancel") {
                c2.stop();
                return msg2.delete().catch(() => {});
              }
              if (!x.isStringSelectMenu()) return;
              await x.deferUpdate();

              const a = x.values[0];
              const g = message.guild;

              if (a === "g_image") {
                const t = await askText(message, "ارسل رابط الصوره او ارفق صوره (او none)");
                if (!t) return;
                const att = t.attachments.first()?.url;
                const raw = (att || t.content.trim());
                if (raw.toLowerCase() === "none") {
                  Pro.delete(`Image = [${g.id}]`);
                  return message.reply("تم");
                }
                Pro.set(`Image = [${g.id}]`, raw);
                return message.reply("تم");
              }

              if (a === "g_role") {
                const t = await askText(message, "منشن رول او ايدي (او none)");
                if (!t) return;
                const raw = t.content.trim();
                if (raw.toLowerCase() === "none") {
                  Pro.delete(`Role = [${g.id}]`);
                  return message.reply("تم");
                }
                const r = t.mentions.roles.first() || g.roles.cache.get(raw.replace(/\D/g, ""));
                if (!r) return message.reply("رول غلط");
                Pro.set(`Role = [${g.id}]`, r.id);
                return message.reply("تم");
              }

              if (a === "g_log") {
                const t = await askText(message, "منشن روم اللوق او ايدي (او none)");
                if (!t) return;
                const raw = t.content.trim();
                if (raw.toLowerCase() === "none") {
                  Pro.delete(`Channel = [${g.id}]`);
                  return message.reply("تم");
                }
                const ch = t.mentions.channels.first() || g.channels.cache.get(raw.replace(/\D/g, ""));
                if (!ch) return message.reply("روم غلط");
                Pro.set(`Channel = [${g.id}]`, ch.id);
                return message.reply("تم");
              }

              if (a === "g_cat") {
                const t = await askText(message, "ايدي كاتجوري (او none)");
                if (!t) return;
                const raw = t.content.trim();
                if (raw.toLowerCase() === "none") {
                  Pro.delete(`Cat = [${g.id}]`);
                  return message.reply("تم");
                }
                const ch = g.channels.cache.get(raw);
                if (!ch || ch.type !== ChannelType.GuildCategory) return message.reply("ايدي غلط");
                Pro.set(`Cat = [${g.id}]`, raw);
                return message.reply("تم");
              }

              if (a === "g_ticketmsg") {
                const t = await askText(message, "اكتب الرساله الافتراضيه داخل التذكره (او none)");
                if (!t) return;
                const raw = t.content.trim();
                if (raw.toLowerCase() === "none") {
                  Pro.delete(`ticket_message_${g.id}`);
                  return message.reply("تم");
                }
                Pro.set(`ticket_message_${g.id}`, raw);
                return message.reply("تم");
              }
            } catch (err) {
              console.error("global settings error:", err);
              return message.reply("صار خطا");
            }
          });

          return;
        }

        if (val === "reset_all") {
          await panelMsg.delete().catch(() => {});
          const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("tiYes").setLabel("اي امسح").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("tiNo").setLabel("لا").setStyle(ButtonStyle.Secondary)
          );

          const msg = await message.reply({
            content: "متاكد تبي تصفر كل نظام التكتات؟",
            components: [confirmRow],
          });

          const cc = msg.createMessageComponentCollector({
            filter: (x) => x.user.id === message.author.id,
            time: 30_000,
            max: 1,
          });

          cc.on("collect", async (x) => {
            await x.deferUpdate();

            if (x.customId === "tiNo") {
              return msg.edit({ content: "تم الغاء", components: [] }).catch(() => {});
            }

            const g = message.guild.id;

            const list = Pro.get(panelsListKey(g)) || [];
            for (const pid of list) {
              Pro.delete(panelKey(g, pid));
            }
            Pro.delete(panelsListKey(g));

            for (const k of [
              `Channel = [${g}]`,
              `Role = [${g}]`,
              `Image = [${g}]`,
              `Cat = [${g}]`,
              `menuOptions_${g}`,
              `ticket_message_${g}`,
            ]) {
              if (Pro.get(k)) Pro.delete(k);
            }

            return msg.edit({ content: "تم تصفير كل شي ✅", components: [] }).catch(() => {});
          });

          return;
        }
      } catch (err) {
        console.error("tipanel error:", err);
        return message.reply("صار خطا");
      }
    });

    collector.on("end", async () => {
      try {
        if (panelMsg && panelMsg.editable) {
          await panelMsg.edit({ components: [] }).catch(() => {});
        }
      } catch {}
    });
  },
};