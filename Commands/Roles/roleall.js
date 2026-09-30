const {
  EmbedBuilder,
  PermissionsBitField,
  Colors,
} = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);

module.exports = {
  name: "allrole",
  aliases: ["roleall"],
  run: async (client, message, args) => {
    if (!message.guild) return;

    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || Colors.Blurple;
    const db = Pro.get(`Allow - Command allrole = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed =
      message.member.roles.cache.has(allowedRole?.id) ||
      message.author.id === db ||
      message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!isAuthorAllowed) return message.react("❌");

    const roleArg = args.join(" ");
    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.find((r) => r.name === roleArg) ||
      message.guild.roles.cache.find((r) => r.id === roleArg);

    if (!role) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n roleall <@رول>**`);
      return message.reply({ embeds: [embed] });
    }

    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return message.reply({ content: "🚫 أحتاج صلاحية **Manage Roles** لإعطاء الرتب." });

    if (role.position >= message.guild.members.me.roles.highest.position)
      return message.reply({ content: "🚫 لا أستطيع إعطاء هذه الرتبة لأنها أعلى من رتبة البوت." });

    const confirmEmbed = new EmbedBuilder()
      .setColor(Color)
      .setDescription(`هل تريد حقًا إعطاء الرتبة ${role} لجميع الأعضاء؟ تفاعل مع ✅ للتأكيد.`);
    const confirmMessage = await message.reply({ embeds: [confirmEmbed] });
    await confirmMessage.react("✅");
    await confirmMessage.react("❌");

    const filter = (reaction, user) =>
      ["✅", "❌"].includes(reaction.emoji.name) && user.id === message.author.id;

    confirmMessage
      .awaitReactions({ filter, max: 1, time: 60000, errors: ["time"] })
      .then(async (collected) => {
        const reaction = collected.first();
        if (reaction.emoji.name === "✅") {
          let success = 0;
          for (const member of message.guild.members.cache.values()) {
            if (!member.roles.cache.has(role.id)) {
              try {
                await member.roles.add(role);
                success++;
              } catch (err) {
                console.error(err);
              }
            }
          }
          message.reply({ content: `✅ تم إعطاء الرتبة ${role} إلى ${success} عضو.` });
        } else {
          message.reply("❌ تم إلغاء العملية.");
        }
      })
      .catch(() => confirmMessage.edit("⏰ انتهى الوقت، تم إلغاء العملية."));
  },
};
