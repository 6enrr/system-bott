const db = require("pro.db");
const { EmbedBuilder, Colors } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "pslist",
  description: "Displays the current status of all protection mechanisms.",
  usage: `pslist`,
  run: async (client, message) => {
    if (!message.guild) return;
    if (!owners.includes(message.author.id)) return message.react("❌");

    const gid = message.guild.id;

    const color =
      db.get(`Guild_Color = ${gid}`) ||
      db.get(`Guild_Color_${gid}`) ||
      Colors.Blurple;

    const onOff = (v) => (v === true || v === "on" ? "مُفعل" : "مُغلق");

    const antibots = onOff(db.get(`antibots_${gid}`));
    const anticreate = onOff(db.get(`anticreate_${gid}`));
    const antidelete = onOff(db.get(`antiDelete_${gid}`));
    const antijoin = onOff(db.get(`antijoinEnabled_${gid}`));
    const antilinks = onOff(db.get(`antilinks_${gid}`));
    const antispam = onOff(db.get(`spamProtectionEnabled_${gid}`));
    const antiwebhook = onOff(db.get(`antiWebhook_${gid}`));
    const antiperms = onOff(db.get(`antiPerms_${gid}`));
    const serverAvatar = onOff(db.get(`antiServerAvatar_${gid}`));
    const serverName = onOff(db.get(`antiServerName_${gid}`));

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("Protection Status")
      .setDescription(
        [
          `\`#1\` Antibots: ${antibots}`,
          `\`#2\` Anticreate: ${anticreate}`,
          `\`#3\` Antidelete: ${antidelete}`,
          `\`#4\` Antijoin: ${antijoin}`,
          `\`#5\` AntiLinks: ${antilinks}`,
          `\`#6\` AntiSpam: ${antispam}`,
          `\`#7\` AntiWebhook: ${antiwebhook}`,
          `\`#8\` AntiPermissions: ${antiperms}`,
          `\`#9\` Server Avatar Protection: ${serverAvatar}`,
          `\`#10\` Server Name Protection: ${serverName}`,
        ].join("\n")
      );

    return message.reply({ embeds: [embed] });
  },
};