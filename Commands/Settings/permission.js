const { EmbedBuilder, Colors, PermissionsBitField } = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

const checkPermissions = (message, commandName) => {
  const dbRoleId = db.get(`Allow - Command ${commandName} = [ ${message.guild.id} ]`);
  const allowedRole = dbRoleId ? message.guild.roles.cache.get(dbRoleId) : null;
  const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
  const hasManageChannels = message.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
  return hasManageChannels || isAuthorAllowed;
};

module.exports = {
  name: "permission",
  description: "View only the active permissions of a role.",
  usage: `  permission @role`,
  run: async (client, message) => {
    if (!checkPermissions(message, "permission")) {
      return message.reply("**ليس لديك الإذن لاستخدام هذا الأمر.**");
    }

    const roleMention = message.mentions.roles.first();
    if (!roleMention) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("Missing Arguments")
        .setDescription(`Please mention a role to view its active permissions.\nUsage: \`  roleinfo @role\``);
      return message.reply({ embeds: [embed] });
    }

    const activePermissions = roleMention.permissions.toArray();
    const activePermissionsList =
      activePermissions.length > 0 ? activePermissions.map((perm) => `✅ ${perm}`).join("\n") : "No active permissions.";

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle(`Active Permissions for role: ${roleMention.name}`)
      .setDescription(activePermissionsList)
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
