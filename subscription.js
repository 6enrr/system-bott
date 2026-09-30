const db = require('pro.db');

// دالة تحويل صيغ الوقت (ساعات h / أيام d / أشهر m) إلى مليمترات ثانية
function parseDuration(durationStr) {
    if (typeof durationStr === 'number') return durationStr * 30 * 24 * 60 * 60 * 1000;
    const match = String(durationStr).trim().match(/^(\d+)([hdm]?)$/i);
    if (!match) return null;
    const amount = parseInt(match[1]);
    const unit = (match[2] || 'm').toLowerCase();

    switch (unit) {
        case 'h': return amount * 60 * 60 * 1000;         // ساعات
        case 'd': return amount * 24 * 60 * 60 * 1000;    // أيام
        case 'm': return amount * 30 * 24 * 60 * 60 * 1000; // أشهر
        default: return null;
    }
}

// دالة فحص حالة الاشتراك
function checkSubscription(guildId) {
    const subData = db.get(`subscription_${guildId}`);
    if (!subData) return { active: false, reason: 'NOT_FOUND' };
    
    const now = Date.now();
    if (now > subData.expiryDate) {
        return { active: false, reason: 'EXPIRED', subData };
    }

    return {
        active: true,
        expiryDate: subData.expiryDate,
        remainingMs: subData.expiryDate - now,
        subData
    };
}

// دالة تفعيل أو تجديد الاشتراك (تضيف الوقت على الوقت الحالي أو القديم)
function activateSubscription(guildId, durationStr) {
    const durationMs = parseDuration(durationStr);
    if (!durationMs) return null;

    const now = Date.now();
    const existing = db.get(`subscription_${guildId}`);
    
    // إذا كان السيرفر مشتركاً مسبقاً واشتراكه ساري، يتم تمديد الانتهاء فوق التاريخ القديم (تجديد حقيقي)
    let newExpiry = now + durationMs;
    if (existing && existing.expiryDate > now) {
        newExpiry = existing.expiryDate + durationMs;
    }

    const payload = {
        guildId,
        expiryDate: newExpiry,
        activatedAt: now,
        lastDuration: durationStr
    };

    db.set(`subscription_${guildId}`, payload);
    return payload;
}

// دالة تنسيق الوقت المتبقي
function formatRemainingTime(ms) {
    if (ms <= 0) return "منتهي";
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    let result = [];
    if (days > 0) result.push(`${days} يوم`);
    if (hours > 0) result.push(`${hours} ساعة`);
    if (minutes > 0) result.push(`${minutes} دقيقة`);
    return result.length > 0 ? result.join(" و ") : "أقل من دقيقة";
}

module.exports = { checkSubscription, activateSubscription, formatRemainingTime };
