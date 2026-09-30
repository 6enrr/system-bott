const db = require("pro.db");
const { PermissionsBitField } = require("discord.js");
const { isBypassed, log } = require("./_utils");

const linkRegex = /(https?:\/\/|discord\.gg\/|discord\.com\/invite\/)/i;
const buckets = new Map();

module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;

  const gid = message.guild.id;
  const member = message.member;

  if (member?.permissions.has(PermissionsBitField.Flags.Administrator)) return;

  if (isBypassed(message.guild, message.author.id)) return;

  const words = db.get(`word_${gid}`) || [];
  if (Array.isArray(words) && words.length) {
    const content = (message.content || "").toLowerCase();
    const hit = words.find(
      (w) => (w?.word || "").toLowerCase() && content.includes((w.word || "").toLowerCase())
    );
    if (hit) {
      await message.delete().catch(() => {});
      await log(message.guild, `🛡️ **WordFilter**: حذف رسالة <@${message.author.id}> بسبب كلمة محظورة: \`${hit.word}\``);
      return;
    }
  }

  const antiLinks = db.get(`antilinks_${gid}`);
  if (antiLinks && linkRegex.test(message.content || "")) {
    await message.delete().catch(() => {});
    await log(message.guild, `🛡️ **AntiLink**: حذف رابط من <@${message.author.id}> في <#${message.channel.id}>`);
    return;
  }

  const antiSpam = db.get(`spamProtectionEnabled_${gid}`);
  if (antiSpam) {
    const key = `${gid}:${message.author.id}`;
    const now = Date.now();
    const b = buckets.get(key) || { count: 0, ts: now };

    if (now - b.ts > 6000) {
      b.count = 0;
      b.ts = now;
    }

    b.count += 1;
    buckets.set(key, b);

    if (b.count >= 5) {
      await message.delete().catch(() => {});
      await log(message.guild, `🛡️ **AntiSpam**: سبام من <@${message.author.id}>`);
      b.count = 0;
      b.ts = now;
      buckets.set(key, b);
    }
  }
};