const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder, Colors } = require("discord.js");

const PUNISH = new Set(["kick", "ban", "timeout", "strip", "none"]);

module.exports = {
  name: "setratelimit",
  description: "ضبط Rate-limit للإنشاء/الحذف (AntiNuke).",
  usage: "setratelimit <limit> <windowSeconds> <kick|ban|timeout|strip|none>",
  run: async (client, message, args) => {
    if (!message.guild) return;
    if (!owners.includes(message.author.id)) return message.react("❌");

    const limit = parseInt(args[0] || "3", 10);
    const windowSec = parseInt(args[1] || "10", 10);
    const punish = (args[2] || "kick").toLowerCase();

    if (!Number.isFinite(limit) || limit < 1 || limit > 50) {
      return message.reply("❌ limit لازم يكون بين 1 و 50");
    }
    if (!Number.isFinite(windowSec) || windowSec < 3 || windowSec > 300) {
      return message.reply("❌ windowSeconds لازم يكون بين 3 و 300");
    }
    if (!PUNISH.has(punish)) {
      return message.reply("❌ العقوبة لازم تكون: kick/ban/timeout/strip/none");
    }

    const gid = message.guild.id;
    db.set(`rl_limit_${gid}`, limit);
    db.set(`rl_windowMs_${gid}`, windowSec * 1000);
    db.set(`rl_punish_${gid}`, punish);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setDescription(
        `✅ Rate-limit: **${limit}** خلال **${windowSec}s** | العقوبة: **${punish}**`
      );

    return message.reply({ embeds: [embed] });
  },
};