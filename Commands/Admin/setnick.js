const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "setnick",
  aliases: ["اسم"],
  run: async (client, message, args) => {
    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const db = Pro.get(`Allow - Command setnick = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === db ||
      message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames);

    if (!isAuthorAllowed) return;

    const member = message.mentions.members.first();
    const name = args.slice(1).join(" ");

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة .\n setnick <@${message.author.id}> ;عفروتو **`
        );
      return message.reply({ embeds: [embed] });
    }

    try {
      if (!name) {
        await member.setNickname("");
        await message.react("✅");
        sendLogMessage(message, member, "");
      } else {
        await member.setNickname(name);
        await message.react("✅");
        sendLogMessage(message, member, name);
      }
    } catch {
      message.react("❌").catch(() => {});
    }
  },
};

function sendLogMessage(message, member, newNickname) {
  const logChannelId = Pro.get(`lognickname_${message.guild.id}`);
  const logChannel = message.guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor("#C88EA7")
    .setAuthor({
      name: member.user.tag,
      iconURL: member.user.displayAvatarURL({ dynamic: true, size: 1024 }),
    })
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/1091536665912299530/1208201551014002848/signature.png"
    )
    .setDescription(
      `**تم تغيير الكنية\n\nالعضو : ${member}\nبواسطة : ${message.author}**\n\`\`\`Nickname => ${
        newNickname || "إزالة الكنية"
      }\`\`\` `
    )
    .setFooter({
      text: message.author.username,
      iconURL: message.author.displayAvatarURL({ dynamic: true, size: 1024 }),
    });

  logChannel.send({ embeds: [embed] });
}
