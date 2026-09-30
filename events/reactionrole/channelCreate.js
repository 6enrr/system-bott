
module.exports = (client) => {
  client.on("channelCreate", async (channel) => {
    if (!channel || channel.type !== 0) return; 

    try {
      const { loadReactionRoles } = require("../../utils/reactionRoles");
      await loadReactionRoles(client, channel.guild.id);
    } catch (err) {
      console.warn("reaction role (channelCreate): couldn't load reaction roles:", err.message);
    }
  });
};
