const { activateSubscription, checkSubscription, formatRemainingTime } = require('../../subscription');

module.exports = {
    name: 'sub',
    description: 'إدارة وتفعيل اشتراكات السيرفرات',
    async execute(message, args, client) {
        const developerId = "1050339172168253470"; // ID المطور الخاص بك
        if (message.author.id !== developerId) {
            return message.reply('❌ هذا الأمر مخصص لمطور البوت فقط!');
        }

        const action = args[0];

        // معرفة تفاصيل اشتراك سيرفر معين: !sub info <guildId>
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

        // تفعيل / تجديد الاشتراك: !sub <Guild_ID> <المدة> [User_ID_العميل]
        const guildId = args[0];
        const durationInput = args[1]; // مثلاً: 12h أو 7d أو 1m
        const buyerUserId = args[2];   // اختياري: ID العميل لإرسال رابط البوت له خاص

        if (!guildId || !durationInput) {
            return message.reply('⚠️ **طريقة الاستخدام:**\n`!sub <Guild_ID> <المدة> [User_ID_العميل]`\n\n*أمثلة:*\n• `!sub 123456789 24h` (تفعيل يوم)\n• `!sub 123456789 1m 987654321` (تفعيل شهر وإرسال الرابط للخاص)');
        }

        const result = activateSubscription(guildId, durationInput);
        if (!result) {
            return message.reply('❌ صيغة الوقت غير صحيحة! استخدم: `12h` (ساعة), `7d` (أيام), `1m` (أشهر).');
        }

        const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`;
        const expiryString = new Date(result.expiryDate).toLocaleString('ar-EG');

        let replyMsg = `✅ **تم تفعيل / تجديد الاشتراك بنجاح!**\n🆔 **السيرفر:** \`${guildId}\`\n⏱️ **المدة:** \`${durationInput}\`\n📅 **ينتهي في:** \`${expiryString}\`\n🔗 **رابط البوت:**\n${inviteLink}`;

        // إرسال الرابط وتفاصيل الاشتراك للعميل على الخاص إن وجد ID
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
