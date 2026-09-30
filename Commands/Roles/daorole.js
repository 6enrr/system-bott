const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: 'daorole',
  run: (client, message) => {
    if (!message.guild) return;

    const isOwner = owners.includes(message.author.id);
    const hasPerms =
      message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
      message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!isOwner && !hasPerms) return message.react('❌');

    db.delete(`autorole_${message.guild.id}`);
    return message.react("✅");
  }
};
