const { 
    activateSubscription, 
    checkSubscription, 
    removeSubscription, 
    formatRemainingTime 
} = require('../../subscription');

module.exports = {
    name: 'sub',
    description: 'إدارة وتفعيل/إلغاء اشتراكات السيرفرات',
    async execute(message, args, client) {
        const developerId = "1050339172168253470"; // ID المطور
        if (message.author.id !== developerId) {
            return message.reply('❌ هذا الأمر مخصص لمطور البوت فقط!');
        }

        const action = args[0]?.toLowerCase();

        // 1. معرفة تفاصيل اشتراك سيرفر: !sub info <guildId>
        if (action === 'info') {
            const targetGuildId = args[1] || message.guild.id;
            const subStatus = checkSubscription(targetGuildId);

            if (!subStatus.active) {
                return message.reply(`❌ السيرفر \`${targetGuildId}\` غير مشترك أو اشتراكه منتهي.`);
            }

            const remaining = formatRemainingTime(subStatus.remainingMs);
            const expiryString = new Date(subStatus.expiryDate).toLocaleString('ar-EG');
            const botMention = subStatus.subData.botClientId ? `<@${subStatus.subData.botClientId}>` : 'غير معروف';

            return message.reply({
                content: `✅ **حالة اشتراك السيرفر:** \`${targetGuildId}\`\n⏳ **المتبقي:** ${remaining}\n📅 **تاريخ الانتهاء:** \`${expiryString}\`\n🤖 **البوت المخصص:** ${botMention}`
            });
        }

        // 2. إلغاء اشتراك سيرفر فوراً: !sub remove <guildId>
        if (action === 'remove' || action === 'delete' || action === 'cancel') {
            const targetGuildId = args[1];
            if (!targetGuildId) {
                return message.reply('⚠️️ يرجى تحديد ID السيرفر لإلغاء اشتراكه.\nمثال: `!sub remove 123456789`');
            }

            const isDeleted = removeSubscription(targetGuildId);
            if (!isDeleted) {
                return message.reply(`❌ السيرفر \`${targetGuildId}\` ليس لديه اشتراك فعال بالأصل.`);
            }

            return message.reply(`🗑️ **تم إلغاء اشتراك السيرفر \`${targetGuildId}\` فوراً وتحرير البوت الخاص به ليعود متاحاً بنجاح!**`);
        }

        // 3. تفعيل / تجديد الاشتراك: !sub <Guild_ID> <المدة> [User_ID_العميل]
        const guildId = args[0];
        const durationInput = args[1]; // مثل: 2min أو 12h أو 7d أو 1m
        const buyerUserId = args[2];   // اختياري: ID العميل

        if (!guildId || !durationInput) {
            return message.reply(
                '⚠️ **طريقة الاستخدام:**\n' +
                '• **للتفعيل:** `!sub <Guild_ID> <المدة> [User_ID_العميل]`\n' +
                '  *(الوقت: `min` دقائق, `h` ساعات, `d` أيام, `m` أشهر)*\n' +
                '• **لمعرفة حالة اشتراك:** `!sub info [Guild_ID]`\n' +
                '• **لإلغاء الاشتراك:** `!sub remove <Guild_ID>`'
            );
        }

        const result = activateSubscription(guildId, durationInput);
        
        // التحقق من الأخطاء (صيغة الوقت أو نفاد التوكنات)
        if (!result.success) {
            if (result.reason === 'INVALID_DURATION') {
                return message.reply('❌ صيغة الوقت غير صحيحة!\nاستخدم: `2min` (دقائق), `12h` (ساعات), `7d` (أيام), `1m` (أشهر).');
            } else if (result.reason === 'NO_TOKENS_AVAILABLE') {
                return message.reply('❌ **لا يوجد أي بوت (توكن) متاح حالياً!** يرجى إضافة توكنات جديدة إلى ملف `tokens.json` أو إلغاء اشتراك سيرفرات قديمة.');
            }
            return message.reply('❌ حدث خطأ غير معروف.');
        }

        // جلب البيانات من الدالة
        const inviteLink = result.inviteLink;
        const expiryString = new Date(result.payload.expiryDate).toLocaleString('ar-EG');
        const botClientId = result.botData.clientId;

        let replyMsg = `✅ **تم تفعيل / تجديد الاشتراك بنجاح وتخصيص بوت للسيرفر!**\n🆔 **السيرفر:** \`${guildId}\`\n⏱️ **المدة:** \`${durationInput}\`\n📅 **ينتهي في:** \`${expiryString}\`\n🤖 **البوت المخصص:** <@${botClientId}>\n🔗 **رابط البوت:**\n${inviteLink}`;

        // إرسال التفاصيل والرابط للخاص إن تم تحديد ID المستخدم
        if (buyerUserId) {
            try {
                const user = await client.users.fetch(buyerUserId);
                if (user) {
                    await user.send({
                        content: `🎉 **مرحباً! تم تفعيل اشتراك سيرفرك بنجاح!**\n\n🆔 **ID السيرفر:** \`${guildId}\`\n📅 **تاريخ الانتهاء:** \`${expiryString}\`\n🤖 **البوت المخصص لك:** <@${botClientId}>\n\n🔗 **رابط إضافة البوت إلى سيرفرك (برتبة أدمن):**\n${inviteLink}`
                    });
                    replyMsg += `\n📩 **تم إرسال رابط البوت المخصص وتفاصيل التفعيل للعميل على الخاص!**`;
                }
            } catch (e) {
                replyMsg += `\n⚠️ **تعذر إرسال الرسالة للخاص (قد تكون الخصوصية مغلقة عند العميل).**`;
            }
        }

        return message.reply(replyMsg);
    }
};
