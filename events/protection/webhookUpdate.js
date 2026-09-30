const db = require("pro.db");
const { PermissionsBitField } = require("discord.js");
const { log } = require("./_utils");

module.exports = async (client, channel) => {
  const guild = channel.guild;
  if (!guild) return;

  const enabled = db.get(`antiWebhook_${guild.id}`);
  if (!enabled) return;

  const me = guild.members.me;
  if (!me?.permissions.has(PermissionsBitField.Flags.ManageWebhooks)) return;

  const hooks = await channel.fetchWebhooks().catch(() => null);
  if (!hooks) return;

  let deleted = 0;
  for (const hook of hooks.values()) {
    await hook.delete("AntiWebhook").catch(() => {});
    deleted++;
  }

  if (deleted) {
    await log(guild, `🛡️ **AntiWebhook**: تم حذف **${deleted}** webhook في <#${channel.id}>`);
  }
};