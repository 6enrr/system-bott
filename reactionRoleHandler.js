module.exports.loadReactionRoles = async function(guild, db) {
  const reactionRoles = db.get(`reaction_roles_${guild.id}`) || {};
};

const { loadReactionRoles } = require('./reactionRoleHandler.js');