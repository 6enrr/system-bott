module.exports = {
  name: 'lock', 
  aliases: ["قفل", "اقفل"],
  run: (client, message, args) => {
      const Pro = require(`pro.db`);
      const db = Pro.get(`Allow - Command lock = [ ${message.guild.id} ]`);
      const allowedRole = message.guild.roles.cache.get(db);
      const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

      if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('MANAGE_CHANNELS')) {
        return message.reply(`:rolling_eyes: **You Don't Have Permissions To lock this channel.**`);
    }


      const guilds = message.guild.me.permissions.has("MANAGE_CHANNELS");
      const a8rgs = message.content.split(' ');
      const channel = message.mentions.channels.first() || client.channels.cache.get(a8rgs[1]) || message.channel;

      if (!guilds) {
          return message.reply({ content: `:rolling_eyes: **I couldn't edit the channel permissions. Please check my permissions and role position.**`, ephemeral: true }).catch((err) => {
              console.log(`Couldn't reply to the message: ` + err.message);
          });
      }

      if (channel.permissionsFor(message.guild.roles.everyone).has('SEND_MESSAGES') === false) {
          return message.reply(`**:x: Channel is already locked ${channel}.**`);
      }


         let everyone = message.guild.roles.cache.find(hyper => hyper.name === '@everyone')
      channel.permissionOverwrites.edit(everyone, {
          SEND_MESSAGES: false,
          SEND_MESSAGES_IN_THREADS: false,
          CREATE_PUBLIC_THREADS: false,
          CREATE_PRIVATE_THREADS: false
      }).then(() => {
          message.reply(`:lock:${channel} **has been locked.**`).catch((err) => {
              console.log(`Couldn't reply to the message: ` + err.message);
          });
      });
  }
}