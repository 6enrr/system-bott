const Discord = require(`discord.js`);
const { owners, prefix } = require(`${process.cwd()}/config`);
const db = require(`pro.db`);

module.exports = {
    name: `slowmode`,
    run: async (client, message) => {
      
      if (!owners.includes(message.author.id)) return message.react('❌');

      const isEnabled = db.get(`command_enabled_${module.exports.name}`);
      if (isEnabled === false) {
          return; 
      }

  if (message.author.bot || message.channel.type === "DM") {
    return;
  }

  const args = message.content.split(" ");
  if (isNaN(args[1])) {
    return message.react('🕐');
  }

  message.react('🕐');
  message.channel.setRateLimitPerUser(args[1]);

        
    }
}