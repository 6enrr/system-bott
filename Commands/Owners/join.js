const { ChannelType } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const Setting_ = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "bot-setvoice",
  description: "〡Join To Voice Channel..",
  aliases: ["setvoice", "247"],
  example: ["setvoice"],
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    try {
      const args = message.content.split(" ");
      const channel =
        message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

      if (!channel || channel.type !== ChannelType.GuildVoice) {
        return message.reply({ content: `**يرجى ارفاق منشن الفويس او الايدي .**` });
      }

      Setting_.set(`Voice_${client.user.id}`, channel.id);

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfMute: true,
        selfDeaf: true,
      });

      await message.react("✅");

      connection.on("error", (error) => {
        console.error(error);
        message.reply({
          content: `**هناكَ خطأٌ يرجى إصلاحهُ**\n\n\`\`\`js\n${error}\`\`\``,
        });
      });
    } catch (_) {
      return;
    }
  },
};
