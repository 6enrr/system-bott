const db = require("pro.db");
const { AuditLogEvent, PermissionsBitField } = require("discord.js");
const { isBypassed, log } = require("./_utils");
const { applyPunishment } = require("./_punish");

module.exports = async (client, member) => {
  const guild = member.guild;
  if (!guild) return;
  const gid = guild.id;

  const joinEnabled = db.get(`antijoinEnabled_${gid}`);
  if (joinEnabled) {
    const ageMs = Date.now() - member.user.createdTimestamp;
    const isNew = ageMs < 1000 * 60 * 60 * 24 * 7; 
    if (isNew) {
      const punishment = db.get(`antijoinPunishment_${gid}`) || "kick";

      await log(guild, `🛡️ **AntiJoin**: حساب جديد دخل: <@${member.id}> | الإجراء: **${punishment}**`);

      if (punishment === "ban") {
        if (guild.members.me?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
          await member.ban({ reason: "AntiJoin: new account" }).catch(() => {});
        }
      } else if (punishment === "kick") {
        if (guild.members.me?.permissions.has(PermissionsBitField.Flags.KickMembers)) {
          await member.kick("AntiJoin: new account").catch(() => {});
        }
      } else if (punishment === "prison") {
        const prisonRoleId = db.get(`prisonRole_${gid}`);
        const role = prisonRoleId ? guild.roles.cache.get(prisonRoleId) : null;
        if (role) await member.roles.add(role, "AntiJoin: prison").catch(() => {});
      }
    }
  }

  if (!member.user.bot) return;

  const antiBotsEnabled = db.get(`antibots_${gid}`);
  if (!antiBotsEnabled) return;

  const global = db.get(`protectionEnabled_${gid}`);
  if (global === false) return;

  const me = guild.members.me;
  const canView = me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog);
  if (!canView) return;

  const entry = await guild
    .fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 1 })
    .then((a) => a.entries.first())
    .catch(() => null);

  const executorId = entry?.executor?.id;
  const targetId = entry?.target?.id;

  if (!executorId || !targetId) return;
  if (targetId !== member.id) return;

  if (isBypassed(guild, executorId)) return;

  await log(guild, `🛡️ **AntiBotAdd**: تمت إضافة بوت <@${member.id}> بواسطة <@${executorId}>`);

  if (member.kickable) await member.kick("AntiBotAdd: revert").catch(() => {});

  await applyPunishment({
    guild,
    executorId,
    key: "punish_botAdd_",
    reason: "AntiBotAdd: unauthorized bot add",
  });
};