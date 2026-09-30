const { EmbedBuilder } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Data = require("pro.db");

module.exports = {
  name: "addalias",
  aliases: ["addalias", "acomnd"],
  run: async function (client, message) {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = Data.get(`Guild_Color_${message.guild.id}`) || "#f5f5ff";
    if (!Color) return;

    const [, commandName, aliasName] = message.content.split(" ");
    const command = client.commands.get(commandName);

    if (!command) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n acomnd ban حظر**`);
      return message.reply({ embeds: [embed] });
    }

    if (!aliasName) return message.reply("**يرجى ادخال اسم الاختصار.**");

    if (command.aliases.includes(aliasName)) return message.reply("**الإختصار موجود بالفعل.**");

    command.aliases.push(aliasName);
    client.commands.set(command.name, command);
    Data.set(`aliases_${command.name}`, command.aliases);

    const embed = new EmbedBuilder()
      .setColor(Color)
      .setDescription(`**تم إضافة اختصار \`${aliasName}\` للأمر \`${commandName}\` بنجاح!**`)
      .addFields({ name: "Current Aliases:", value: command.aliases.join(", ") || "لا يوجد." });

    message.reply({ embeds: [embed] });
  },
};
