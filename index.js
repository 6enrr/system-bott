require('./server.js');
const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const db = require("pro.db");

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

// تحميل الأوامر من المجلدات الفرعية داخل Commands
const commandsPath = path.join(__dirname, "Commands");
if (fs.existsSync(commandsPath)) {
  const cats = fs.readdirSync(commandsPath);

  for (const cat of cats) {
    const catPath = path.join(commandsPath, cat);
    if (!fs.lstatSync(catPath).isDirectory()) continue;

    const files = fs.readdirSync(catPath).filter((f) => f.endsWith(".js"));

    for (const file of files) {
      const cmdPath = path.join(catPath, file);
      try {
        const cmd = require(cmdPath);
        if (!cmd || !cmd.name) continue;

        client.commands.set(cmd.name.toLowerCase(), cmd);

        if (Array.isArray(cmd.aliases)) {
          cmd.aliases.forEach((al) => {
            client.aliases.set(al.toLowerCase(), cmd.name.toLowerCase());
          });
        }
      } catch (err) {
        console.error(`❌ Failed to load ${file} in ${cat}:`, err);
      }
    }
  }
}

// تحميل الأحداث (Events)
const eventsRoot = path.join(__dirname, "events");
if (fs.existsSync(eventsRoot)) {
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
      } catch (err) {
        console.error(`❌ Event load error in ${file}:`, err);
      }
    }
  });
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

const tokenToLogin = config.token || process.env.DISCORD_TOKEN;
client.login(tokenToLogin);
