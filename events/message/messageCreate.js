const db = require("pro.db");

// استدعاء نظام الاشتراكات بشكل آمن يراعي موقع الملف داخل مجلد events
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

module.exports = async (client, message) => {
    if (!message || !message.guild || message.author.bot) return;

    // التفاعل التلقائي بالإيموجيات (إن وجد)
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

    // إزالة علامة ! من بداية اسم الأمر إن وجدت لضمان التعرف عليه
    if (cmdName.startsWith("!")) {
        cmdName = cmdName.slice(1);
    }

    const command =
        client.commands.get(cmdName) ||
        client.commands.get(client.aliases.get(cmdName));

    // إذا لم تكن الرسالة أمراً مسجلاً في البوت، يتجاهلها فوراً ولا ينفذ شيئاً
    if (!command) return;

    // 1. استثناء أمر sub الخاص بالمطور ليعمل دائماً لتفعيل الاشتراكات
    if (cmdName === "sub" || command.name === "sub") {
        // يتجاوز فحص الاشتراك وينفذ الأمر مباشرة
    } else {
        // 2. فحص اشتراك السيرفر لبقية الأوامر العامة (مثل help وغيرها)
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
