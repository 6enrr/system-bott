const { owners } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "uptime",
  run: (client, message) => {
    const db = Pro.get(`Allow - Command uptime = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
    const isOwner = owners.includes(message.author.id);

    if (!isAuthorAllowed && message.author.id !== db && !isOwner) return;
    if (message.author.bot) return;

    let uptime = client.uptime;
    let days = 0, hours = 0, minutes = 0, seconds = 0, keep = true;
    while (keep) {
      if (uptime >= 8.64e7) { days++; uptime -= 8.64e7; }
      else if (uptime >= 3.6e6) { hours++; uptime -= 3.6e6; }
      else if (uptime >= 60000) { minutes++; uptime -= 60000; }
      else if (uptime >= 1000) { seconds++; uptime -= 1000; }
      if (uptime < 1000) keep = false;
    }
    message.channel.send("`" + `${days} days, ${hours} hrs, ${minutes} , ${seconds} sec` + "`");
  },
};
