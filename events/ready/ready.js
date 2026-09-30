const Data = require("pro.db");

module.exports = async (client) => {
    console.table({
        Name: client.user.tag,
        Ping: client.ws.ping,
        Prefix: client.prefix,
        ID: client.user.id,
        Server: client.guilds.cache.size,
        Members: client.users.cache.size,
        Channels: client.channels.cache.size,
        Developer: "Joker"
    });

    client.commands.forEach(command => {
        const aliases = Data.get(`aliases_${command.name}`);
        if (aliases) {  
            command.aliases = aliases;
            client.commands.set(command.name, command);
        }
    });
};
