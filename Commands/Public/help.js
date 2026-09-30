const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const db = require("pro.db");
const { prefix } = require("../../config.json");

module.exports = {
  name: "help",
  aliases: ["هلب", "هيلب"],
  run: async (client, message) => {
    const isEnabled = db.get(`command_enabled_help`);
    if (isEnabled === false) return;

    const guildColor =
      db.get(`Guild_Color_${message.guild?.id}`) || "#2b2d31";

    const totalCommands = client.commands?.size || 0;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const mainEmbed = new EmbedBuilder()
      .setColor(guildColor)
      .setTitle("اوامر البوت :")
      .setDescription(
        `يمكنك الآن عرض كافة الأوامر الخاصة بك
**عدد الأوامر:** \`${totalCommands}\`
`
      )
      .setThumbnail("https://cdn.discordapp.com/embed/avatars/0.png")
      .setFooter({ text: timeStr });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("help_menu")
      .setPlaceholder("اختر من القائمة")
      .addOptions(
        {
          label: "الأوامر العامة",
          value: "help1",
          description: "أوامر لكل الأعضاء",
        },
        {
          label: "الأوامر الإدارية",
          value: "help2",
          description: "ميوت - باند - تحذيرات ...",
        },
        {
          label: "أوامر الرتب",
          value: "help3",
          description: "role / autorole / srole...",
        },
        {
          label: "أوامر الشات",
          value: "help4",
          description: "lock / unlock / hide ...",
        },
        {
          label: "الحماية",
          value: "help5",
          description: "anti / sec / wanted ...",
        },
        {
          label: "الإعدادات",
          value: "help6",
          description: "log / setclear / allow ...",
        },
        {
          label: "التذاكر",
          value: "help7",
          description: "setticket / close ...",
        },
        {
          label: "القروبات",
          value: "help11",
          description: "cgroup / panel ...",
        },
        {
          label: "الرومات الصوتية",
          value: "help12",
          description: "callow / cdeny ...",
        },
        {
          label: "أوامر السيرفر (الأونر)",
          value: "help9",
          description: "vip / owners ...",
        },
        {
          label: "إغلاق القائمة",
          value: "help10",
          description: "حذف رسالة الهيلب",
        }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    const msg = await message.reply({
      embeds: [mainEmbed],
      components: [row],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 120_000,
    });

    collector.on("collect", async (interaction) => {
      const val = interaction.values[0];
      const Color = guildColor;
      let replyembed;

      await interaction.deferUpdate();

      if (val === "help1") {
        replyembed = new EmbedBuilder()
          .setColor(Color)
          .setTitle("الأوامر العامة")
          .setDescription(
            `
**  help** : **قائمه المساعدة**
**  avatar** : **عرض صورة شخص**
**  banner** : **عرض بنر شخص**
**  user** : **عرض معلومات عضو**
**  top** : **عرض توب 8 اشخاص**
**  profile** : **عرض بروفيال العضو**
**  id** : **عرض لفلك او لفل شخص معين**
**  server** : **عرض معلومات السيرفر**
**  myinv** : **عدد دعواتك**
**  top-invites** : **اعلى عدد دعوات**
**  mcolors** : **اختار لونك من القائمة**
**  colors** : **علبة الالوان**
**  color** : **اختيار لون**
**  change** : **اضافة فلتر لصورة**
**  circle** : **عرض صورة العضو على شكل دائرة**
**  aremove** : **يزيل خلفية الصور**
**  semoji** : **إرسال صورة الايموجي**
**  edit-image** : **فلاتر وتعديل علي الصور**
            `
          )
          .setFooter({ text: timeStr });
      }

      else if (val === "help2") {
        replyembed = new EmbedBuilder()
          .setColor(Color)
          .setTitle("الأوامر الإدارية")
          .setDescription(
            `
**  stickers** : **اضافة ستيكرز للسيرفر**
**  aemoji** : **اضافة ايموجي للسيرفر**
**  kickofflinebots** : **طرد البوتات غير متصلة**
**  blockpic** : **بلوك صور**
**  blocked** : **عرض الاعضاء من عليهم بلوك صور**
**  removeblockpic** : **ازالة بلوك الصور من شخص**
**  mute** : **اسكات كتابي**
**  mymute** : **معلومات ميوت العضو**
**  unmute** : **الغاء الاسكات الكتابي**
**  prison** : **سجن عضو**
**  myprison** : **معلومات سجن العضو**
**  unprison** : **فك سجن عضو**
**  vunmute** : **فك ميوت صوتي عن عضو**
**  rooms** : **اظهار الادمن الخارجين من الرومات الصوتيه**
**  adminlist** : **اظهار جميع الادمن بالسيرفر**
**  vkick** : **طرد عضو من الروم الصوتي**
**  vmute** : **اسكات عضو من الفويس**
**  infractions** : **اظهار عقوبات العضو**
**  ban** : **حظر العضو**
**  unban** : **الغاء الحظر من شخص**
**  unbanal** : **الغاء المحظورين من السيرفر**
**  allbans** : **قائمة المحظورين**
**  lastvoice** : **معرفة اخر دخول رومات صوتية**
**  kick** : **طرد عضو من السيرفر**
**  setnick** : **تغيير اسم عضو داخل السيرفر**
**  clear** : **مسح رسائل الشات**
**  records** : **سجل عقوبات العضو**
**  move** : **سحب عضو الى روم اخر**
**  moveme** : **توديك لعضو بروم اخر**
**  warn** : **اعطاء تحذير لعضو**
**  warnings** : **قائمة التحذيرات لعضو**
**  remove-warn** : **إزالة تحذير**
**  blacklist** : **اعطاء بلاكلست لعضو**
**  setupBlacklistChat** : **تحديد شات البلاك ليست**
**  remove-blacklist** : **إزلة البلاك ليست من عضو**
**  timeout** : **اعطاء تايم اوت**
**  untimeout** : **ازلة التايم اوت**
**  stats** : **اظهار معلومات الاداري**
            `
          )
          .setFooter({ text: timeStr });
      }

      else if (val === "help3") {
        replyembed = new EmbedBuilder()
          .setColor(Color)
          .setTitle("أوامر الرتب")
          .setDescription(
            `
**  setreactionrole** : **رياكدشن رول**
**  rereactrole** : **إزلة رياكدشن رول**
**  role** : **اضافة رتبة لعضو**
**  myrole** : **تعديل رولك الخاص**
**  dsrole** : **حذف رول خاص**
**  srole** : **انشاء رول خاص**
**  addrole** : **انشاء رول جديد**
**  autorole** : **اضافة رتبة لكل عضو يدخل**
**  daorole** : **حذف تحديد الرول التلقائي**
**  allrole** : **اعطاء رول لجميع الاعضاء**
**  r all -rolename** : **ازاله رول من جميع الاعضاء**
**  here** : **اضافة رول الهير للعضو**
**  image** : **اضافة رول الصور للعضو**
**  editrole** : **تعديل اسم الرول**
**  live** : **اضافة رتبة تسمح بفتح كام وشير**
**  nick** : **اضافة رتبه تغير الاسم**
**  check** : **تشييك على الاعضاء في الرول**
**  checkvc** : **تشييك على الاعضاء في الرول المتصلين**
            `
          )
          .setFooter({ text: timeStr });
      }

      else if (val === "help4") {
        replyembed = new EmbedBuilder()
          .setColor(Color)
          .setTitle("أوامر الشات")
          .setDescription(
            `
**  ochat** : **تحديد شات الاوامر**
**  feel** : **اعداد شات الفيلنج**
**  hide** : **إخفاء الشات عن الكل**
**  unhide** : **إظهار الشات للكل**
**  unhideall** : **إظهار كل الرومات**
**  hideall** : **اخفاء كل الرومات**
**  lock** : **قفل الروم**
**  unlock** : **فتح الروم**
**  slowmode** : **تفعيل الوضع البطيء بالشات**
**  autoreply** : **اضافة كلمة وردها**
**  dreply** : **حذف كلمة وردها**
**  mhide** : **إخفاء الشات عن عضو**
**  mshow** : **إظهار الشات لعضو**
**  autoline** : **فاصل تلقائي بالشات**
**  unline** : **تعطيل الفاصل التلقائي بالشات**
**  setreact** : **رياكدشن تلقائي بالشات**
**  unreact** : **تعطيل الرياكشن التلقائي بالشات**
**  applay** : **تفعيل المنشن والصور بالشات**
**  disapplay** : **تعطيل المنشن والصور بالشات**
**  setpic** : **شات الصور**
**  embed** : **رسالة على شكل امبيد**
**  unpic** : **تعطيل شات الصور**
**  rate** : **تقييم تلقائي** 
**  feedrate** : **تحديد شات التقييم التلقائي** 
**  setrchat** : **تعيين شات التقييمات**
**  dltrchat** : **حذف شات التقييمات**
**  setrimage** : **تعيين صورة التقييمات**
**  setrcolor** : **تعيين لون صورة خط التقييمات**
            `
          )
          .setFooter({ text: timeStr });
      }

else if (val === "help5") {
  replyembed = new EmbedBuilder()
    .setColor(Color)
    .setTitle("أوامر الحماية")
    .setDescription(
      `
** advice** : **نصايح ممكن تفيدك بحماية السيرفر**
** sechard** : **تشغيل / إيقاف الحماية القصوى**
** setlimit** : **تحدد الحد للحمايه**
** maxsec** : **تشغيل الحماية المتقدمة**
** sloprot** : **تحدد روم لوق الحماية**
** aprot** : **تضيف شخص يتخطى الحماية**
** dprot** : **تشيل شخص من قائمة تخطي الحماية**
** bots** : **يعرض لك كل البوتات بالسيرفر**
** word** : **تضيف أو تحذف كلمة ممنوعة**
** wordlist** : **يعرض الكلمات الممنوعة**
** pslist** : **يعرض الحمايات المفعلة والمعطلة**
** restbackup** : **يرجع نسخة السيرفر**
** block** : **يمنع عضو من السيرفر**
** unblock** : **يفك المنع عن عضو**
** setsecurity** : **يسوي رومات لوق للحماية**
** wanti** : **تضيف شخص مسموح له يتخطى الحماية**
** wantilist** : **يعرض الأشخاص المسموح لهم**
** servername** : **تشغيل / إيقاف حماية اسم السيرفر**
** serveravatar** : **تشغيل / إيقاف حماية صورة السيرفر**
** setrjoin** : **تحدد وش يصير للحسابات الجديدة**
** antijoin** : **تشغيل / إيقاف منع الحسابات الجديدة**
** antibots** : **تشغيل / إيقاف منع البوتات**
** antilink** : **تشغيل / إيقاف منع الروابط**
** antidelete** : **تشغيل / إيقاف منع حذف الرومات والرولات**
** anticreate** : **تشغيل / إيقاف منع إنشاء الرومات والرولات**
** antispam** : **تشغيل / إيقاف منع السبام**
** antiwebhook** : **تشغيل / إيقاف منع إنشاء ويب هوك**
** antiperms** : **تشغيل / إيقاف منع تغيير صلاحيات الرولات**
** cols** : **تعديل حماية الرولات**

━━━━━━━━━━━━━━━━━━
**🛡️ أوامر تحديد العقوبات**

** setpunish** : **تحدد العقوبة لكل نوع حماية**
** setratelimit** : **تحدد عدد الأفعال قبل ما يتعاقب الشخص**

━━━━━━━━━━━━━━━━━━
**📌 أمثلة سريعة**

**مثال : لو أحد حذف رومات كثير**
\`setpunish channelDelete ban\`

**مثال : لو أحد حذف رولات**
\`setpunish roleDelete kick\`

**مثال : لو أحد أنشأ رومات كثير**
\`setpunish channelCreate timeout 30\`

**مثال : لو أحد رفع صلاحيات الرولات**
\`setpunish rolePerms strip\`

**مثال : لو أحد حاول يضيف بوت**
\`setpunish botAdd ban\`

**مثال : لو أحد يسوي أفعال كثيرة بسرعة**
\`setratelimit 3 10 kick\`

يعني لو شخص حذف أو أنشأ أكثر من **3 مرات خلال 10 ثواني**
البوت راح **يطرده تلقائي**
      `
    )
    .setFooter({ text: timeStr });
}
      else if (val === "help6") {
        replyembed = new EmbedBuilder()
          .setColor(Color)
          .setTitle("أوامر الإعدادات")
          .setDescription(
            `
**  allow** : **السماح لعضو او رول لاستعمال امر**
**  deny** : **منع لعضو او رول لاستعمال امر**
**  listallow** : **قائمة السماح**
**  permission** : **رؤية البرمشنات المفعلة فقط**
**  settings** : **تعديل اعدادات السيرفر**
**  setlog** : **انشاء شاتات اللوق**
**  detlog** : **حذف شاتات اللوق**
**  setbanlimit** : **وضع حد للباند عن طريق بوت** 
**  chanpro** : **تحديد خلفية امر بروفايل**
**  imagechat** : **تحديد صورة لعلبة الالوان**
**  ctcolors** : **انشاء رولات الوان**
**  setclear** : **إلغاء / تحديد شات المسج التلقائي**
**  edit-wlc** : **تعديل اعدادات الترحيب**
**  edit-avt** : **أوامر تعديل سيرفرات الافتارت**
**  clearcat** : **تعين المسح التلقائي للرومات الصوتيه**
**  rblock** : **منع عضو من رول معين**
**  runblock** : **إزلة الرول المحظور من عضو**
**  setuadmin** : **فقط من قام باعطاء العقوبه قادر على ازالتها**
**  pallow** : **يستطيع فك اي عقوبه من العقوبات**
**  plist** : **عرض قائمة الاشخاص من يمتلكون صلاحية فك اي عقوبة**
**  premove** : **ازالة الشخص من فك اي عقوبه**
**  reasons** : **تعيين اسباب العقوبات**
**  locomnd** : **تفعيل او تعطيل امر**
**  setvoice** : **تثبيت البوت بفويس**
**  progress** : **تفعيل أو ايقاف نظام النقاط**
**  reset-all** : **تصفير جميع النقاط**
**  reset** : **تصفير نقاط عضو**
**  dinfractions** : **تعديل عقوبات العضو**
**  settask** : **تحديد المهام الاداريه**
**  task** : **عرض المهام الاداريه**
**  removetask** : **إزالة مهمة إدارية**
            `
          )
          .setFooter({ text: timeStr });
      }

      else if (val === "help7") {
        replyembed = new EmbedBuilder()
          .setColor(Color)
          .setTitle("أوامر التذاكر")
          .setDescription(
            `
**tipanel** : كل اعدادات نظام التذاكر من مكان واحد

**tpanel** : انشاء وادارة بانلات التذاكر
امثلة:
tpanel create support #support
tpanel show support
tpanel send support #support
tpanel move support #support
tpanel delete support

**tmenu** : اضافة او حذف خيارات القائمة داخل البانل

امثلة:
tmenu add support دعم فني | tech | مشاكل عامة | 🛠️
tmenu add support حسابات | account | مشاكل تسجيل الدخول | <:shop:123456789012345678>

tmenu list support
tmenu remove support tech
tmenu clear support
            `
          )
          .setFooter({ text: timeStr });
      }

      else if (val === "help9") {
        replyembed = new EmbedBuilder()
          .setColor(Color)
          .setTitle("أوامر السيرفر / الأونر")
          .setDescription(
            `
**  vip** : **أوامر ألاونر**
**  guild** : **نقل البوت من سيرفر الي سيرفر**
**  dm** : **ارسال رساله لخاص العضو**
**  say** : **ارسال رساله عن طريق البوت**
**  cmunprefix** : **أستعامل جميع الاوامر بدون برفيكس**
**  owners** : **عرض قائمة الاونرات**
**  setowner** : **إضافة اونر للبوت**
**  setbanner** : **تغيير بنر البوت**
**  setavatar** : **تغيير صورة البوت**
**  rembanner** : **إزلة بنر البوت** 
**  setname** : **تغيير اسم البوت**
**  setstatus** : **تغيير حالة البوت**
**  setecolor** : **تغيير لون الامبيد**
**  removeowner** : **ازالة اونر من البوت**
**  addalias** : **أضافه اختصار للأوامر**
**  showaliases** : **يظهر قائمة الاختصارات**
**  removealias** : **يحذف اختصار**
**  resetbot** : **فورمات للبوت كامل**
**  uptime** : **مدة تشغيل البوت**
**  restart** : **اعادة تشغيل البوت**
            `
          )
          .setFooter({ text: timeStr });
      }

      else if (val === "help11") {
        replyembed = new EmbedBuilder()
          .setColor(Color)
          .setTitle("أوامر القروبات")
          .setDescription(
            `
**  cgroup** : **انشاء قروب جديد**
**  delgroup** : **حذف قروب**
**  grole** : **اضافة رول القروب الى العضو**
**  panel** : **لوحة تحكم للقروبات**
**  rerole** : **ازالة رول القروب من العضو**
**  groups** : **يعرض لك القروبات المسجله بالنظام**
            `
          )
          .setFooter({ text: timeStr });
      }

      else if (val === "help12") {
        replyembed = new EmbedBuilder()
          .setColor(Color)
          .setTitle("أوامر الرومات الصوتية")
          .setDescription(
            `
**  callow** : **سماح لعضو بدخول الروم الصوتي**
**  cdeny** : **منع العضو من دخول الروم الصوتي**
**  chide** : **اخفاء الروم الصوتي عن عضو معين**
**  clist** : **قائمة الاشخاص الممنوعين من دخول روم معين**
**  cunhide** : **اظهار الروم الصوتي عن عضو معين**
            `
          )
          .setFooter({ text: timeStr });
      }

      else if (val === "help10") {
        if (interaction.user.id !== message.author.id) {
          return message.channel
            .send({
              content: "هذي القائمة مو لك.",
              reply: { messageReference: message.id },
            })
            .catch(() => {});
        }
        collector.stop("delete");
        return msg.delete().catch(() => {});
      }

      if (replyembed) {
        await msg.edit({
          embeds: [replyembed],
          components: [row],
        });
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "delete") return;
      msg.edit({ components: [] }).catch(() => {});
    });
  },
};
