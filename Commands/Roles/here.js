const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const Data = require(`pro.db`);

module.exports = {
  name: 'here',
  aliases: ["هير"],
  run: async (client, message) => {
    try {
      if (!message.guild || message.author.bot) return;

      const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';

      const db = Pro.get(`Allow - Command pic = [ ${message.guild.id} ]`);
      const allowedRole = message.guild.roles.cache.get(db);
      const isAuthorAllowed =
        message.member.roles.cache.has(allowedRole?.id) ||
        message.author.id === db ||
        message.member.permissions.has(PermissionsBitField.Flags.ManageRoles);

      if (!isAuthorAllowed) return;

      const userID = message.content.split(' ').slice(1).join(' ');
      const user = message.mentions.members.first() || message.guild.members.cache.get(userID);

      if (!user) {
        const embed = new EmbedBuilder()
          .setColor(Color)
          .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n هير <@${message.author.id}>**`);
        return message.reply({ embeds: [embed] });
      }

      const key = `Here = ${message.guild.id}`;
      let picroleId = Pro.get(key);
      let picrole = picroleId ? message.guild.roles.cache.get(picroleId) : null;

      if (!picrole) {
        try {
          picrole = await message.guild.roles.create({
            name: 'Here',
            reason: 'Creating role',
            permissions: [PermissionsBitField.Flags.MentionEveryone],
          });
          Pro.set(key, picrole.id);
        } catch (error) {
          console.error('Error creating role:', error);
          return message.react('❌');
        }
      }

      const reason = `<@!${message.author.id}>`;

      if (user.roles.cache.has(picrole.id)) {
        await user.roles.remove(picrole, reason).catch(() => {});
        return message.react('✅');
      } else {
        await user.roles.add(picrole, reason).catch(() => {});
        return message.react('✅');
      }
    } catch (error) {
      console.error(error);
    }
  }
};
