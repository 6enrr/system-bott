const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder, Colors } = require("discord.js");

const MODULES = {
  channelDelete: "punish_channelDelete_",
  roleDelete: "punish_roleDelete_",
  channelCreate: "punish_channelCreate_",
  roleCreate: "punish_roleCreate_",
  webhook: "punish_webhook_",
  rolePerms: "punish_rolePerms_",
  ban: "punish_ban_",
  kick: "punish_kick_",
  botAdd: "punish_botAdd_",
};

const PUNISH = new Set(["kick", "ban", "timeout", "strip", "none"]);

module.exports = {
  name: "setpunish",
  description: "تحديد عقوبة الحماية لكل نوع (anti-nuke).",
  usage: "setpunish <module> <kick|ban|timeout|strip|none> [durationMinutes للـ timeout]",
  run: async (client, message, args) => {
    if (!message.guild) return;
    if (!owners.includes(message.author.id)) return message.react("❌");

    const mod = (args[0] || "").trim();
    const action = (args[1] || "").toLowerCase();

    if (!MODULES[mod] || !PUNISH.has(action)) {
      return message.reply(
        "❌ الاستخدام:\n" +
          "`setpunish <module> <kick|ban|timeout|strip|none> [minutes]`\n\n" +
          "الموديولات:\n" +
          Object.keys(MODULES).map((k) => `- ${k}`).join("\n")
      );
    }

    const gid = message.guild.id;

    let minutes = 10;
    if (action === "timeout") {
      const m = parseInt(args[2] || "10", 10);
      if (!Number.isFinite(m) || m < 1 || m > 10080) minutes = 10; 
      else minutes = m;
      db.set(`timeout_minutes_${gid}`, minutes);
    }

    db.set(`${MODULES[mod]}${gid}`, action);

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(
        `✅ تم حفظ العقوبة للمود: **${mod}** = **${action}**` +
          (action === "timeout" ? ` لمدة **${minutes}** دقيقة` : "")
      );

    return message.reply({ embeds: [embed] });
  },
};