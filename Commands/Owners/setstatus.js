const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");

module.exports = {
  name: "setstatus",
  run: async (client, message, args) => {
    const db = Pro.get(`Allow - Command setavatar = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);
    const isOwner = owners.includes(message.author.id);

    if (!isAuthorAllowed && !isOwner) {
      return message.reply("**You don't have permission to change the bot's status!**");
    }

    const currentStatus = client.presence?.status || "offline";
    await message.reply(`**Current status: \`${currentStatus}\`**`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("online").setLabel("Online").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("idle").setLabel("Idle").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("dnd").setLabel("Do Not Disturb").setStyle(ButtonStyle.Danger),
    );

    const response = await message.reply({
      content: "**Please select a status for the bot:**",
      components: [row],
    });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter, time: 60_000 });

    collector.on("collect", async (interaction) => {
      const status = interaction.customId;
      try {
        await client.user.setPresence({ status });
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("online").setLabel("Online").setStyle(ButtonStyle.Primary).setDisabled(true),
          new ButtonBuilder().setCustomId("idle").setLabel("Idle").setStyle(ButtonStyle.Secondary).setDisabled(true),
          new ButtonBuilder().setCustomId("dnd").setLabel("Do Not Disturb").setStyle(ButtonStyle.Danger).setDisabled(true),
        );
        await interaction.update({ content: `**The bot's status has been changed to \`${status}\`!**`, components: [disabledRow] });
        collector.stop();
      } catch (error) {
        console.error(error);
        if (!interaction.replied) {
          await interaction.reply({ content: `**An error occurred while changing the bot's status: ${error.message}**`, ephemeral: true });
        }
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) message.reply("**No status was selected in time!**");
    });
  },
};
