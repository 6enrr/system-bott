const db = require("pro.db");

// استدعاء نظام الاشتراكات
let checkSubscription;
try {
    checkSubscription = require("../../subscription").checkSubscription;
} catch {
    try {
        checkSubscription = require("../subscription").checkSubscription;
    } catch {
        checkSubscription = require("./subscription").checkSubscription;
    }
}

// ⚠️ ضع هنا ID حسابك في ديسكورد لتستطيع استخدام البوت في أي سيرفر بدون تفعيل
const DEVELOPER_IDS = ["1050339172168253470"];

module.exports = async (client, message) => {
    if (!message || !message.guild || message.author.bot) return;

    // التفاعل التلقائي بالإيموجيات
    const reactData = db.get(`RoomInfo_${message.guild.id}_${message.channel.id}`);
    if (reactData && Array.isArray(reactData.emojis)) {
        for (const emoji of reactData.emojis) {
            try {
                await message.react(emoji);
            } catch {}
        }
    }

    const args = message.content.trim().split(/\s+/);
    let cmdName = args.shift().toLowerCase();

    if (cmdName.startsWith("!")) {
        cmdName = cmdName.slice(1);
    }

    const command =
        client.commands.get(cmdName) ||
        client.commands.get(client.aliases.get(cmdName));

    if (!command) return;

    const isDeveloper = DEVELOPER_IDS.includes(message.author.id);
    const isSubCommand = cmdName === "sub" || command.name === "sub";

    // إذا لم يكن المستخدم هو المطور ولم يكن الأمر هو sub، نفحص اشتراك السيرفر
    if (!isDeveloper && !isSubCommand) {
        if (typeof checkSubscription === "function") {
            const subStatus = checkSubscription(message.guild.id);
            if (!subStatus.active) {
                return message.reply({
                    content: `❌ **عذراً، هذا السيرفر غير مشترك أو انتهت صلاحية اشتراكه!**\n\n🆔 **ID السيرفر:** \`${message.guild.id}\`\n📩 يرجى التواصل مع الإدارة لتجديد الاشتراك وتفعيل البوت.`
                });
            }
        }
    }

    // تنفيذ الأمر
    try {
        if (typeof command.run === "function") {
            await command.run(client, message, args);
        } else if (typeof command.execute === "function") {
            await command.execute(client, message, args);
        } else if (typeof command === "function") {
            await command(client, message, args);
        }
    } catch (err) {
        console.error(`❌ خطأ في الأمر ${cmdName}:`, err);
        message.reply("حدث خطأ أثناء تنفيذ الأمر.");
    }
};
