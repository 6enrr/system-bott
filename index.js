require('./server.js');
const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const db = require("pro.db");

// 1. قراءة قائمة التوكنات من Environment Variable أو من tokens.json
let tokens = [];

if (process.env.BOT_TOKENS_JSON) {
  try {
    tokens = JSON.parse(process.env.BOT_TOKENS_JSON);
  } catch (error) {
    console.error("❌ خطأ في قراءة BOT_TOKENS_JSON من البيئة:", error);
  }
}

if ((!tokens || tokens.length === 0) && fs.existsSync(path.join(__dirname, "tokens.json"))) {
  try {
    tokens = JSON.parse(fs.readFileSync(path.join(__dirname, "tokens.json"), "utf8"));
  } catch (error) {}
}

// في حال عدم وجود توكنات متعددة، القراءة من config.json أو DISCORD_TOKEN
if (!tokens || tokens.length === 0) {
  let config = {};
  try { config = require("./config.json"); } catch (e) {}
  const defaultToken = config.token || process.env.DISCORD_TOKEN;
  if (defaultToken) {
    tokens = [{ token: defaultToken }];
  }
}

// دالة تحميل الأوامر
function loadCommands(client) {
  client.commands = new Collection();
  client.aliases = new Collection();

  const commandsPath = path.join(__dirname, "Commands");
  if (!fs.existsSync(commandsPath)) return;

  const cats = fs.readdirSync(commandsPath);

  for (const cat of cats) {
    const catPath = path.join(commandsPath, cat);
    if (!fs.lstatSync(catPath).isDirectory()) continue;

    const files = fs.readdirSync(catPath).filter((f) => f.endsWith(".js"));

    for (const file of files) {
      const cmdPath = path.join(catPath, file);
      try {
        delete require.cache[require.resolve(cmdPath)];
        const cmd = require(cmdPath);
        if (!cmd || !cmd.name) continue;

        client.commands.set(cmd.name.toLowerCase(), cmd);

        if (Array.isArray(cmd.aliases)) {
          cmd.aliases.forEach((al) => {
            client.aliases.set(al.toLowerCase(), cmd.name.toLowerCase());
          });
        }
      } catch (err) {
        console.error(`❌ فشل تحميل الأمر ${file} في ${cat}:`, err);
      }
    }
  }
}

// دالة تحميل الأحداث (Events)
function loadEvents(client) {
  const eventsRoot = path.join(__dirname, "events");
  if (!fs.existsSync(eventsRoot)) return;

  fs.readdirSync(eventsRoot).forEach((folder) => {
    const fullFolder = path.join(eventsRoot, folder);
    if (!fs.lstatSync(fullFolder).isDirectory()) return;

    const eventFiles = fs.readdirSync(fullFolder).filter((f) => f.endsWith(".js"));

    for (const file of eventFiles) {
      const evPath = path.join(fullFolder, file);
      const eventName = file.split(".")[0];

      try {
        delete require.cache[require.resolve(evPath)];
        const eventFn = require(evPath);
        if (eventName === "ready") {
          client.once("ready", (...args) => eventFn(client, ...args));
        } else {
          client.on(eventName, (...args) => eventFn(client, ...args));
        }
      } catch (err) {
        console.error(`❌ خطأ في تحميل الحدث ${file}:`, err);
      }
    }
  });
}

// تشغيل كل بوت
function startBot(botData, index) {
  const token = typeof botData === "string" ? botData : botData.token;
  if (!token) return;

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

  loadCommands(client);
  loadEvents(client);

  client.once("ready", () => {
    console.log(`🤖 [Bot #${index + 1}] تم تسجيل الدخول: ${client.user.tag} (${client.user.id})`);
  });

  client.login(token).catch((err) => {
    console.error(`❌ [Bot #${index + 1}] فشل تسجيل الدخول:`, err.message);
  });
}

// تشغيل البوتات الـ 10
console.log(`🚀 جاري تشغيل ${tokens.length} بوت...`);
tokens.forEach((botData, index) => {
  startBot(botData, index);
});
