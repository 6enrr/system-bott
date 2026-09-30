const db = require('pro.db');

// تحويل الوقت (دقائق min / ساعات h / أيام d / أشهر m)
function parseDuration(durationStr) {
    if (!durationStr) return null;
    if (typeof durationStr === 'number') return durationStr * 30 * 24 * 60 * 60 * 1000;
    
    const match = String(durationStr).trim().match(/^(\d+)(min|h|d|m)?$/i);
    if (!match) return null;
    
    const amount = parseInt(match[1]);
    const unit = (match[2] || 'm').toLowerCase();

    switch (unit) {
        case 'min': return amount * 60 * 1000;              // دقائق
        case 'h': return amount * 60 * 60 * 1000;           // ساعات
        case 'd': return amount * 24 * 60 * 60 * 1000;      // أيام
        case 'm': return amount * 30 * 24 * 60 * 60 * 1000; // أشهر (30 يوم)
        default: return null;
    }
}

// فحص اشتراك السيرفر
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

// تفعيل أو تجديد الاشتراك
function activateSubscription(guildId, durationStr) {
    const durationMs = parseDuration(durationStr);
    if (!durationMs) return null;

    const now = Date.now();
    const existing = db.get(`subscription_${guildId}`);
    
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

// إلغاء/حذف الاشتراك
function removeSubscription(guildId) {
    const existing = db.get(`subscription_${guildId}`);
    if (!existing) return false;
    db.delete(`subscription_${guildId}`);
    return true;
}

// تنسيق الوقت المتبقي بالعربي
function formatRemainingTime(ms) {
    if (ms <= 0) return "منتهي";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    let result = [];
    if (days > 0) result.push(`${days} يوم`);
    if (hours > 0) result.push(`${hours} ساعة`);
    if (minutes > 0) result.push(`${minutes} دقيقة`);
    if (days === 0 && hours === 0 && minutes === 0 && seconds > 0) {
        result.push(`${seconds} ثانية`);
    }
    return result.length > 0 ? result.join(" و ") : "أقل من دقيقة";
}

module.exports = { 
    checkSubscription, 
    activateSubscription, 
    removeSubscription, 
    formatRemainingTime 
};
