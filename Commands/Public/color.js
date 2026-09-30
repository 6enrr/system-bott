const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "color",
  aliases: ["لون"],
  description: "to choose a specific color",
  run: async (client, message, args) => {
    if (!args[0]) {
      return message.reply("**يُرجى كتابة رقم اللون بعد الأمر.**");
    }

    const allowedColors = Array.from(
      { length: 200 },
      (_, i) => (i + 1).toString()
    );

    if (args[0] === "0") {
      const memberRoles = message.member.roles.cache.filter((role) =>
        allowedColors.includes(role.name.toLowerCase())
      );

      if (memberRoles.size === 0) {
        return message.channel.send("**ليس لديك أدوار ألوان لإزالتها!**");
      }

      for (const role of memberRoles.values()) {
        await message.member.roles
          .remove(role)
          .catch(() => {});
      }

      return message.reply("**تم إزالة اللون الخاص بك.**");
    }

    if (!allowedColors.includes(args[0])) {
      return message.channel.send("**اللون الذي اخترته غير موجود**");
    }

    const newColorRole = message.guild.roles.cache.find((role) => {
      return (
        role.name.toLowerCase() === args.join(" ").toLowerCase()
      );
    });

    if (!newColorRole) {
      return message.channel.send("**الرقم المدخل للون غير موجود**");
    }

    if (!newColorRole.editable) {
      return message.channel.send(
        "**ليس لدي أذونات للتعديل/منح هذا الدور!**"
      );
    }

    for (const role of message.member.roles.cache.values()) {
      if (
        allowedColors.includes(role.name.toLowerCase()) &&
        args.join(" ").toLowerCase() !== role.name.toLowerCase()
      ) {
        await message.member.roles
          .remove(role)
          .catch(() => {});
      }
    }

    await message.member.roles.add(newColorRole).catch(() => {});

    const embed = new EmbedBuilder()
      .setDescription(
        `**${message.member.user} تم تغيير اللون بنجاح (${newColorRole.name}) ✅**`
      )
      .setColor(newColorRole.color || "#2f3136");

    return message.channel.send({ embeds: [embed] });
  },
};
