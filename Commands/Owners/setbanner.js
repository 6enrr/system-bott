const { EmbedBuilder } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10"); 
const fetch = require("node-fetch");

let lastUpdate = {};

module.exports = {
  name: "setbanner",
  aliases: ["sebn"],
  run: async function (client, message) {
    if (!owners.includes(message.author.id)) {
      return message.reply("You do not have permission to use this command.");
    }

    const userId = message.author.id;
    const now = Date.now();
    const cooldownTime = 300000;

    if (lastUpdate[userId] && now - lastUpdate[userId] < cooldownTime) {
      const timeLeft = Math.ceil((cooldownTime - (now - lastUpdate[userId])) / 1000);
      return message.reply(`You are changing your banner too fast. Please wait ${timeLeft} seconds before trying again.`);
    }

    try {
      let bannerURL = null;

      if (message.attachments.size) {
        const att = message.attachments.first();
        bannerURL = att.url;
        if (!validateImageType(att.contentType)) {
          return message.reply("Please submit a valid GIF, PNG, or JPEG format for banners.");
        }
      } else {
        await message.reply("Please send the new banner as a URL.");
        const filter = (m) => m.author.id === message.author.id && (m.attachments.size > 0 || /^https?:\/\/\S+\.\S+/.test(m.content));
        const response = await message.channel.awaitMessages({ filter, max: 1, time: 60_000 });
        if (response.size === 0) return message.reply("No response received, banner not updated.");
        bannerURL = response.first().attachments.size ? response.first().attachments.first().url : response.first().content;
        if (!(await validateImageTypeByUrl(bannerURL))) {
          return message.reply("Please submit a valid GIF, PNG, or JPEG format for banners.");
        }
      }

      const buffer = await fetch(bannerURL).then((r) => r.buffer());
      const rest = new REST({ version: "10" }).setToken(client.token);
      await rest.patch(Routes.user(), { body: { banner: `data:image;base64,${buffer.toString("base64")}` } });

      lastUpdate[userId] = now;

      const embed = new EmbedBuilder().setColor("Blurple").setDescription("Your banner has been successfully updated!");
      return message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      if (error.message?.includes("rate limit")) return message.reply("You are changing your banner too fast. Try again later.");
      return message.reply(`An error occurred while updating the banner: \`${error.message}\``);
    }
  },
};

async function validateImageTypeByUrl(url) {
  const valid = ["image/gif", "image/png", "image/jpeg"];
  const res = await fetch(url);
  const ct = res.headers.get("content-type");
  return valid.includes(ct);
}
function validateImageType(contentType) {
  const valid = ["image/gif", "image/png", "image/jpeg"];
  return valid.includes(contentType);
}
