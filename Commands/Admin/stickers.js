const Pro = require("pro.db");
const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "addstickers",
  aliases: ["stickers"],
  run: async (client, message) => {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      return message.react("❌");

    const enabled = Pro.get(`command_enabled_addstickers`);
    if (enabled === false) return;

    const m = await message.reply(
      "> **ارسل الستيكر خلال 30 ثانية**"
    );

    const collector = message.channel.createMessageCollector({
      filter: (msg) =>
        msg.author.id === message.author.id &&
        msg.stickers.size > 0,
      time: 30_000,
      max: 1,
    });

    collector.on("collect", async (msg) => {
      const sticker = msg.stickers.first();
      m.delete().catch(() => {});

      const waitMsg = await message.channel.send(
        "> **يتم اضافة الستيكر...**"
      );

      message.guild.stickers
        .create({
          file: sticker.url,
          name: sticker.name,
        })
        .then((created) => {
          waitMsg.edit(
            `> **تم اضافة الستيكر بأسم \`${created.name}\` ✅**`
          );
        })
        .catch(() => {
          waitMsg.edit("**ما قدرت أضيفه، يمكن وصلت الحد.**");
        });
    });

    collector.on("end", (col, reason) => {
      if (reason === "time") {
        m.delete().catch(() => {});
        message.reply("**انتهى الوقت**");
      }
    });
  },
};
