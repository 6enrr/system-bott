const db = require("pro.db");
const { AuditLogEvent, PermissionsBitField } = require("discord.js");
const { isBypassed, log } = require("./_utils");

const dangerous = new Set([
  PermissionsBitField.Flags.Administrator,
  PermissionsBitField.Flags.ManageGuild,
  PermissionsBitField.Flags.ManageRoles,
  PermissionsBitField.Flags.ManageChannels,
  PermissionsBitField.Flags.BanMembers,
  PermissionsBitField.Flags.KickMembers,
  PermissionsBitField.Flags.ManageWebhooks,
]);

function hasDangerous(perms) {
  for (const p of dangerous) if (perms.has(p)) return true;
  return false;
}

module.exports = async (client, oldRole, newRole) => {
  const guild = newRole.guild;
  if (!guild) return;

  const enabled = db.get(`antiPerms_${guild.id}`);
  if (!enabled) return;

  if (!hasDangerous(newRole.permissions) || hasDangerous(oldRole.permissions)) return;

  const entry = await guild
    .fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 1 })
    .then((a) => a.entries.first())
    .catch(() => null);

  const executorId = entry?.executor?.id;
  if (!executorId) return;

  if (isBypassed(guild, executorId)) return;

  await newRole
    .setPermissions(oldRole.permissions, "AntiPerms: revert dangerous perms")
    .catch(() => {});
  await log(guild, `🛡️ **AntiPerms**: تم منع رفع صلاحيات رول **${newRole.name}** بواسطة <@${executorId}>`);

  const member = await guild.members.fetch(executorId).catch(() => null);
  if (member && member.kickable) await member.kick("AntiPerms: RoleUpdate").catch(() => {});
};