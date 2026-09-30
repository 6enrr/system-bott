const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Data = require("pro.db");

module.exports = {
  name: "top",
  aliases: ["top"],
  run: async (client, message, args) => {
    if (Data.get(`command_enabled_${module.exports.name}`) === false) return;

    const setChannel = Data.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    const mentionedUser = message.mentions.users.first() || message.author;
    const userId = mentionedUser.id;

    const type = args[0] ? args[0].toLowerCase() : "both";

    try {
      const leaderboardData = await fetchLeaderboardData();
      const userPoints = await fetchUserPoints(userId);

      const pageSize = 10;
      let currentPage = 0;

      let embed, entries;
      if (type === "text") {
        entries = leaderboardData.textEntries;
        embed = createTopEmbed(
          message,
          entries,
          userPoints,
          mentionedUser,
          "text",
          currentPage,
          pageSize
        );
      } else if (type === "voice") {
        entries = leaderboardData.voiceEntries;
        embed = createTopEmbed(
          message,
          entries,
          userPoints,
          mentionedUser,
          "voice",
          currentPage,
          pageSize
        );
      } else {
        return message.reply({
          embeds: [
            createCombinedTopEmbed(
              message,
              leaderboardData,
              userPoints,
              mentionedUser
            ),
          ],
        });
      }

      const buttons = createNavigationButtons(
        entries,
        currentPage,
        pageSize
      );

      const sentMessage = await message.reply({
        embeds: [embed],
        components: [buttons],
      });

      const filter = (i) => i.user.id === message.author.id;
      const collector = sentMessage.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "previous") {
          currentPage = Math.max(0, currentPage - 1);
        } else if (interaction.customId === "next") {
          currentPage = Math.min(
            Math.ceil(entries.length / pageSize) - 1,
            currentPage + 1
          );
        }

        const updatedEmbed = createTopEmbed(
          message,
          entries,
          userPoints,
          mentionedUser,
          type,
          currentPage,
          pageSize
        );
        const updatedButtons = createNavigationButtons(
          entries,
          currentPage,
          pageSize
        );

        await interaction.update({
          embeds: [updatedEmbed],
          components: [updatedButtons],
        });
      });

      collector.on("end", async () => {
        const disabledButtons = createNavigationButtons(
          entries,
          currentPage,
          pageSize,
          true
        );
        await sentMessage.edit({ components: [disabledButtons] })
          .catch(() => {});
      });
    } catch (error) {
      console.error(error);
      message.reply("❌ حدث خطأ أثناء جلب التوب.");
    }
  },
};

function createNavigationButtons(
  entries,
  currentPage,
  pageSize,
  disabled = false
) {
  const totalPages = Math.ceil(entries.length / pageSize);

  const previousButton = new ButtonBuilder()
    .setCustomId("previous")
    .setLabel("Previous")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled || currentPage === 0);

  const nextButton = new ButtonBuilder()
    .setCustomId("next")
    .setLabel("Next")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(
      disabled || currentPage === totalPages - 1 || totalPages === 0
    );

  return new ActionRowBuilder().addComponents(previousButton, nextButton);
}

function createTopEmbed(
  message,
  entries,
  userPoints,
  mentionedUser,
  type,
  currentPage,
  pageSize
) {
  const embed = new EmbedBuilder()
    .setColor("#ffffff")
    .setFooter({
      text: `Requested by: ${message.author.tag} | Page ${
        currentPage + 1
      }`,
      iconURL: message.author.displayAvatarURL({ dynamic: true }),
    })
    .setAuthor({
      name: `📋 Top ${type === "text" ? "Text" : "Voice"} Leaderboard`,
      iconURL: message.guild.iconURL({ dynamic: true }),
    });

  const startIndex = currentPage * pageSize;
  const pageEntries = entries.slice(startIndex, startIndex + pageSize);

  const leaderboardText =
    pageEntries.length > 0
      ? pageEntries
          .map(
            (entry, index) =>
              `**#${startIndex + index + 1}. <@${
                entry.userId.split("_")[0]
              }> - ${entry.points} XP**`
          )
          .join("\n")
      : "No users found.";

  embed.setDescription(leaderboardText);

  const userRankKey = type === "text" ? "textRank" : "voiceRank";
  const userPointsKey = type === "text" ? "textPoints" : "voicePoints";
  const userRankDisplay = userPoints[userRankKey]
    ? `**#${userPoints[userRankKey]} ${mentionedUser} - ${userPoints[userPointsKey]} XP**`
    : `**${mentionedUser} Rank: Not in the ranking**`;

  embed.addFields({
    name: "Your Rank",
    value: userRankDisplay,
  });

  return embed;
}

function createCombinedTopEmbed(
  message,
  leaderboardData,
  userPoints,
  mentionedUser
) {
  const embed = new EmbedBuilder()
    .setColor("#ffffff")
    .setFooter({
      text: `Requested by: ${message.author.tag}`,
      iconURL: message.author.displayAvatarURL({ dynamic: true }),
    })
    .setAuthor({
      name: "📋 Guild Score Leaderboards",
      iconURL: message.guild.iconURL({ dynamic: true }),
    });

  const textRankDisplay = userPoints.textRank
    ? `**#${userPoints.textRank} ${mentionedUser} - ${userPoints.textPoints} XP**`
    : `**${mentionedUser} Text Rank: Not in the ranking**`;

  const voiceRankDisplay = userPoints.voiceRank
    ? `**#${userPoints.voiceRank} ${mentionedUser} - ${userPoints.voicePoints} XP**`
    : `**${mentionedUser} Voice Rank: Not in the ranking**`;

  embed.addFields(
    {
      name: "TOP TEXT 💬",
      value:
        formatTopUsers(leaderboardData.textEntries.slice(0, 8)) +
        `\n${textRankDisplay}\n:sparkles: **More?** \`/top text\``,
      inline: true,
    },
    {
      name: "TOP VOICE 🎙️",
      value:
        formatTopUsers(leaderboardData.voiceEntries.slice(0, 8)) +
        `\n${voiceRankDisplay}\n:sparkles: **More?** \`/top voice\``,
      inline: true,
    }
  );

  return embed;
}

function formatTopUsers(users) {
  return users.length > 0
    ? users
        .map(
          (entry, index) =>
            `**#${index + 1}. <@${
              entry.userId.split("_")[0]
            }> - ${entry.points} XP**`
        )
        .join("\n")
    : "No users found.";
}

async function fetchLeaderboardData() {
  const allUsers = await Data.fetchAll();
  return {
    textEntries: getSortedEntries(allUsers, "_points"),
    voiceEntries: getSortedEntries(allUsers, "_voice"),
  };
}

function getSortedEntries(allUsers, suffix) {
  return Object.entries(allUsers)
    .filter(([key]) => key.endsWith(suffix))
    .sort(([, valueA], [, valueB]) => valueB - valueA)
    .map((entry, index) => ({
      userId: entry[0],
      points: entry[1],
      rank: index + 1,
    }));
}

async function fetchUserPoints(userId) {
  const textPoints = (await Data.get(`${userId}_points`)) || 0;
  const voicePoints = (await Data.get(`${userId}_voice`)) || 0;
  return {
    textPoints,
    voicePoints,
    textRank: await getUserRank(userId, "_points"),
    voiceRank: await getUserRank(userId, "_voice"),
  };
}

async function getUserRank(userId, suffix) {
  const allUsers = await Data.fetchAll();
  const entries = Object.entries(allUsers)
    .filter(([key]) => key.endsWith(suffix))
    .sort(([, a], [, b]) => b - a);
  const index = entries.findIndex(
    ([key]) => key.split("_")[0] === userId
  );
  return index === -1 ? null : index + 1;
}
