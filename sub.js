const { activateSubscription } = require('./subscription'); // عدل المسار حسب مكان الملف عندك

module.exports = {
    name: 'sub',
    description: 'تفعيل اشتراك سيرفر معين (للمطور فقط)',
    async execute(message, args, client) {
        // ضع الآي دي الخاص بك هنا لضمان أنك الوحيد القادر على استخدام الأمر
        const developerId = "783762831958212698"; 
        if (message.author.id !== developerId) {
            return message.reply('❌ هذا الأمر مخصص لمطور البوت فقط!');
        }

        const guildId = args[0];
        const months = parseInt(args[1]);

        if (!guildId || !months) {
            return message.reply('⚠️ الاستخدام الصحيح: `!sub <Guild_ID> <عدد الشهور>`');
        }

        // تفعيل الاشتراك في قاعدة البيانات
        activateSubscription(guildId, months);
        message.reply(`✅ تم تفعيل الاشتراك بنجاح للسيرفر: \`${guildId}\` لمدة **${months}** أشهر!`);
    }
};
