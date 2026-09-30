const fs = require("fs");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "cmunprefix",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const newPrefix = "";

    fs.readFile("./config.json", (err, data) => {
      if (err) return console.log(err);
      const config = JSON.parse(data);
      config.prefix = newPrefix;
      fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err2) => {
        if (err2) console.log(err2);
      });
      message.react("✅");
    });
  },
};
