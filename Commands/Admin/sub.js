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

            return message.reply({
                content: `✅ **حالة اشتراك السيرفر:** \`${targetGuildId}\`\n⏳ **المتبقي:** ${remaining}\n📅 **تاريخ الانتهاء:** \`${expiryString}\``
            });
        }

        // 2. إلغاء اشتراك سيرفر فوراً: !sub remove <guildId>
        if (action === 'remove' || action === 'delete' || action === 'cancel') {
            const targetGuildId = args[1];
            if (!targetGuildId) {
                return message.reply('⚠️ يرجى تحديد ID السيرفر لإلغاء اشتراكه.\nمثال: `!sub remove 123456789`');
            }

            const isDeleted = removeSubscription(targetGuildId);
            if (!isDeleted) {
                return message.reply(`❌ السيرفر \`${targetGuildId}\` ليس لديه اشتراك فعال بالأصل.`);
            }

            return message.reply(`🗑️ **تم إلغاء اشتراك السيرفر \`${targetGuildId}\` فوراً وبنجاح!**`);
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
        if (!result) {
            return message.reply('❌ صيغة الوقت غير صحيحة!\nاستخدم: `2min` (دقائق), `12h` (ساعات), `7d` (أيام), `1m` (أشهر).');
        }

        // رابط دعوة البوت المخصص الخاص بك
        const inviteLink = "https://discord.com/oauth2/authorize?client_id=1554895717716328479&permissions=8&integration_type=0&scope=bot";

        const expiryString = new Date(result.expiryDate).toLocaleString('ar-EG');

        let replyMsg = `✅ **تم تفعيل / تجديد الاشتراك بنجاح!**\n🆔 **السيرفر:** \`${guildId}\`\n⏱️ **المدة:** \`${durationInput}\`\n📅 **ينتهي في:** \`${expiryString}\`\n🔗 **رابط البوت:**\n${inviteLink}`;

        // إرسال التفاصيل والرابط للخاص إن تم تحديد ID المستخدم
        if (buyerUserId) {
            try {
                const user = await client.users.fetch(buyerUserId);
                if (user) {
                    await user.send({
                        content: `🎉 **مرحباً! تم تفعيل اشتراك سيرفرك بنجاح!**\n\n🆔 **ID السيرفر:** \`${guildId}\`\n📅 **تاريخ الانتهاء:** \`${expiryString}\`\n\n🔗 **رابط إضافة البوت إلى سيرفرك:**\n${inviteLink}`
                    });
                    replyMsg += `\n📩 **تم إرسال رابط البوت وتفاصيل التفعيل للعميل على الخاص!**`;
                }
            } catch (e) {
                replyMsg += `\n⚠️ **تعذر إرسال الرسالة للخاص (قد تكون الخصوصية مغلقة عند العميل).**`;
            }
        }

        return message.reply(replyMsg);
    }
};
