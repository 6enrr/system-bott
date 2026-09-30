const db = require("pro.db");

module.exports = async function bypass(member) {

if (!member || !member.guild) return false;

const guild = member.guild;

if (member.id === guild.ownerId) return true;

const bypassMembers = db.get(`bypassedMembers_${guild.id}`) || [];
if (bypassMembers.includes(member.id)) return true;

const bypassRoles = db.get(`bypassedRoles_${guild.id}`) || [];
if (member.roles.cache.some(r => bypassRoles.includes(r.id))) return true;

return false;

};