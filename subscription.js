const fs = require('fs');
const path = require('path');
const db = require('pro.db');

const TOKENS_PATH = path.join(__dirname, 'tokens.json');

// قراءة قائمة التوكنات إما من Environment Variables أو من الملف المحلي
function getTokensList() {
    // 1. المحاولة الأولى: القراءة من Render Environment Variable
    if (process.env.BOT_TOKENS_JSON) {
        try {
            return JSON.parse(process.env.BOT_TOKENS_JSON);
        } catch (e) {
            console.error("❌ Error parsing BOT_TOKENS_JSON:", e);
        }
    }

    // 2. المحاولة الثانية: القراءة من ملف tokens.json إن وجد محلياً
    if (fs.existsSync(TOKENS_PATH)) {
        try {
            return JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
        } catch (e) {}
    }

    return [];
}

// تخصيص توكن للبوت من التوكنات المتاحة مع المزامنة مع قاعدة البيانات
function assignBotToken(guildId) {
    const tokens = getTokensList();
    if (!tokens.length) return null;

    const now = Date.now();

    // 1. إذا كان السيرفر مخصصاً له بوت سابقاً واشتراكه ما زال سارياً
    const existing = db.get(`subscription_${guildId}`);
    if (existing && existing.botClientId && existing.expiryDate > now) {
        const found = tokens.find(t => t.clientId === existing.botClientId);
        if (found) return found;
    }

    // 2. جمع البوتات المشغولة حالياً في سيرفرات أخرى نشطة
    const busyClientIds = new Set();
    try {
        const allKeys = db.keys ? db.keys() : [];
        allKeys.forEach(key => {
            if (key.startsWith('subscription_')) {
                const sub = db.get(key);
                if (sub && sub.expiryDate > now && sub.botClientId && sub.guildId !== guildId) {
                    busyClientIds.add(sub.botClientId);
                }
            }
        });
    } catch (e) {}

    // 3. اختيار أول بوت غير مشغول
    const available = tokens.find(t => !busyClientIds.has(t.clientId));
    return available || null;
}

// تحويل الوقت (دقائق min / ساعات h / أيام d / أشهر m)
function parseDuration(durationStr) {
    if (!durationStr) return null;
    if (typeof durationStr === 'number') return durationStr * 30 * 24 * 60 * 60 * 1000;
    
    const match = String(durationStr).trim().match(/^(\d+)(min|h|d|m)?$/i);
    if (!match) return null;
    
    const amount = parseInt(match[1]);
    const unit = (match[2] || 'm').toLowerCase();

    switch (unit) {
        case 'min': return amount * 60 * 1000;
        case 'h': return amount * 60 * 60 * 1000;
        case 'd': return amount * 24 * 60 * 60 * 1000;
        case 'm': return amount * 30 * 24 * 60 * 60 * 1000;
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

// تفعيل أو تجديد الاشتراك وترشيح توكن للبوت
function activateSubscription(guildId, durationStr) {
    const durationMs = parseDuration(durationStr);
    if (!durationMs) return { success: false, reason: 'INVALID_DURATION' };

    const botData = assignBotToken(guildId);
    if (!botData) return { success: false, reason: 'NO_TOKENS_AVAILABLE' };

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
        lastDuration: durationStr,
        botClientId: botData.clientId,
        botId: botData.id
    };

    db.set(`subscription_${guildId}`, payload);

    const inviteLink = `https://discord.com/oauth2/authorize?client_id=${botData.clientId}&permissions=8&scope=bot%20applications.commands`;

    return {
        success: true,
        payload,
        inviteLink,
        botData
    };
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
    formatRemainingTime,
    parseDuration
};
