
module.exports = (client) => {
  client.on("guildCreate", async (guild) => {
    console.log(`Joined a new guild: ${guild.name}`);

    try {
      const { loadReactionRoles } = require("../../utils/reactionRoles");
      await loadReactionRoles(client, guild.id);
    } catch (err) {
      console.warn("reaction role (guildCreate): couldn't load reaction roles:", err.message);
    }
  });
};
