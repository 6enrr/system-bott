const db = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "detlog",
  description: "حذف قنوات اللوق المخزنة وإزالة مفاتيحها من قاعدة البيانات.",
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const logKeys = [
      "channelmessage","logpic","logchannels","lognickname",
      "logjoinleave","loglinks","logbots","logroles",
      "logvjoinvexit","logmove","logbanunban","logkick",
      "logtvoicemute","logmutedeafen","logtimeuntime",
      "logemoji","logprisonunprison","logtmuteuntmute","logwarns",
      "logantidelete","logprotection","logantijoinbots","logblocklist",
    ];

    try {
      for (const key of logKeys) {
        const id = db.get(`${key}_${message.guild.id}`);
        if (id) {
          const ch = message.guild.channels.cache.get(id);
          if (ch) await ch.delete(`detlog command by ${message.author.tag}`).catch(() => {});
          db.delete(`${key}_${message.guild.id}`);
        }
      }
      message.react("✅");
    } catch (e) {
      console.error(e);
      message.reply("حدث خطأ أثناء حذف اللوقات.");
    }
  },
};
