const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fetch = require("node-fetch");
const { prefix } = require(`${process.cwd()}/config`);
const Data = require("pro.db");
let lastUsed = new Map();

module.exports = {
  name: "link",
  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    if (!Data.has(`server_${message.guild.id}`) && !Data.has(`avatar_${message.guild.id}`) && !Data.has(`shop_${message.guild.id}`)) {
      const replyMessage = await message.reply(`**يرجى تثبيت شاتات نشر الروابط\n edit-avt**`).catch(console.error);
      setTimeout(() => replyMessage.delete().catch(console.error), 10_000);
      return;
    }

    const cooldown = 180_000;
    const prev = lastUsed.get(message.author.id) || 0;
    const diff = Date.now() - prev;
    if (diff < cooldown) {
      const timeLeft = cooldown - diff;
      const m = Math.floor(timeLeft / 60000);
      const s = Math.floor((timeLeft % 60000) / 1000);
      return message.reply(`**يرجى الانتظار حتى انتهاء الوقت، الوقت المتبقي ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}**`);
    }

    const serverChannelId = Data.get(`server_${message.guild.id}`);
    const avatarChannelId = Data.get(`avatar_${message.guild.id}`);
    const shopChannelId  = Data.get(`shop_${message.guild.id}`);

    const serverChannel = serverChannelId ? message.guild.channels.cache.get(serverChannelId) : null;
    const avatarChannel = avatarChannelId ? message.guild.channels.cache.get(avatarChannelId) : null;
    const shopChannel   = shopChannelId  ? message.guild.channels.cache.get(shopChannelId)  : null;

    const link = args.join(" ");
    if (!link || !link.startsWith("https://discord.gg")) {
      return message.reply("**Wrong Usage** | #link <link>").then(m => setTimeout(() => m.delete().catch(()=>{}), 20_000));
    }

    const inviteCode = link.split("discord.gg/")[1];
    const guild = await resolveInvite(inviteCode);
    if (!guild) {
      return message.reply("**السيرفر غير موجود ❌.**").then(m => setTimeout(() => m.delete().catch(()=>{}), 20_000));
    }

    const options = [];
    if (serverChannel) options.push({ label: "serv", description: "#مُخصص لسيرفرات الكوميونتي", value: "1" });
    if (avatarChannel) options.push({ label: "avvt", description: "#مُخصص لسيرفرات الافتارت", value: "2" });
    if (shopChannel)   options.push({ label: "shop", description: "#مُخصص لسيرفرات المتاجر",  value: "3" });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("serverType")
        .setPlaceholder("يرجى اختيار نوع القناة.")
        .addOptions(options)
    );

    const cancelRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("Cancel2").setLabel("الغاء").setStyle(ButtonStyle.Secondary)
    );

    const prompt = await message.channel.send({ content: "**يرجى أختار نوع سيرفرك**", components: [row, cancelRow] });
    await message.delete().catch(()=>{});

    const collector = prompt.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id && ["serverType","Cancel2"].includes(i.customId),
      time: 20_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "Cancel2") {
        await prompt.delete().catch(()=>{});
        return;
      }
      const choice = i.values[0];
      let sent;
      if (choice === "1" && serverChannel) sent = await serverChannel.send(`> **${guild.name}**\n${link}`);
      if (choice === "2" && avatarChannel) sent = await avatarChannel.send(`> **${guild.name}**\n${link}`);
      if (choice === "3" && shopChannel)   sent = await shopChannel.send(`> **${guild.name}**\n${link}`);

      lastUsed.set(message.author.id, Date.now());
      await i.update({ content: `**تم نشر سيرفرك بنجاح ${sent ? sent.channel : "خطأ"} ✅**`, components: [] });
    });

    collector.on("end", () => {
      if (prompt.deletable) prompt.delete().catch(()=>{});
    });
  },
};

async function resolveInvite(code) {
  const res = await fetch(`https://discord.com/api/v9/invites/${code}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.guild || !data.guild.id) return null;
  return { id: data.guild.id, name: data.guild.name };
}
