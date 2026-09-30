require('./server.js');
const fs = require("fs");
const path = path = require("path");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const db = require("pro.db");
const { checkSubscription } = require("./subscription"); // استدعاء نظام فحص الاشتراكات

// محاولة قراءة ملف الإعدادات محلياً، وإذا لم يوجد على سيرفر الاستضافة يتجاوز الخطأ بأمان
let config = {};
try {
  config = require("./config.json");
} catch (error) {
  config = {};
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
client.aliases = new Collection();

const commandsPath = path.join(__dirname, "Commands");
const cats = fs.readdirSync(commandsPath);

for (const cat of cats) {
  const catPath = path.join(commandsPath, cat);
  const files = fs.readdirSync(catPath).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const cmdPath = path.join(catPath, file);
    try {
      const cmd = require(cmdPath);

      if (!cmd || !cmd.name) {
        console.warn(`⚠️ ملف بدون اسم: ${cat}/${file}`);
        continue;
      }

      client.commands.set(cmd.name.toLowerCase(), cmd);

      if (Array.isArray(cmd.aliases)) {
        cmd.aliases.forEach((al) => {
          client.aliases.set(al.toLowerCase(), cmd.name.toLowerCase());
        });
      }

      console.log(`✅ Loaded command: ${cat}/${cmd.name}`);
    } catch (err) {
      console.error(`❌ Failed to load ${file} in ${cat}:`, err);
    }
  }
}

const eventsRoot = path.join(__dirname, "events");

fs.readdirSync(eventsRoot).forEach((folder) => {
  const fullFolder = path.join(eventsRoot, folder);
  if (!fs.lstatSync(fullFolder).isDirectory()) return;

  const eventFiles = fs.readdirSync(fullFolder).filter((f) => f.endsWith(".js"));

  for (const file of eventFiles) {
    const evPath = path.join(fullFolder, file);
    const eventName = file.split(".")[0];

    try {
      const eventFn = require(evPath);

      if (eventName === "ready") {
        client.once("ready", (...args) => eventFn(client, ...args));
      } else {
        client.on(eventName, (...args) => eventFn(client, ...args));
      }

      console.log(`⚡ Loaded event: ${folder}/${file}`);
    } catch (err) {
      console.error(`❌ Event load error in ${file}:`, err);
    }
  }
});

// نظام حماية الأوامر وفحص الاشتراك (Middleware)
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // جلب البادئة (Prefix) الخاصة بالبوت أو الافتراضية
  const prefix = config.prefix || "!"; // استبدلها بالبادئة المستخدمة عندك إذا كانت مختلفة

  // التحقق مما إذا كان الرسالة تبدأ بأمر التفعيل لكي لا يتم حظره
  if (message.content.startsWith(`${prefix}sub`)) {
    return; // السماح بمرور أمر التفعيل فوراً
  }

  // فحص ما إذا كان السيرفر مشترك وصالح
  const isSubscribed = checkSubscription(message.guild.id);
  if (!isSubscribed) {
    return message.reply({
      content: "❌ **عذراً، هذا السيرفر غير مشترك أو انتهت صلاحية اشتراكه!** يرجى التواصل مع الإدارة لتجديد الاشتراك وتفعيل البوت."
    });
  }
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// يقرأ التوكن من الملف المحلي أو من إعدادات Render تلقائياً
const tokenToLogin = config.token || process.env.DISCORD_TOKEN;
client.login(tokenToLogin);
