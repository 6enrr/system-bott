const db = require('pro.db');

function checkSubscription(guildId) {
    const subData = db.get(`subscription_${guildId}`);
    if (!subData) return false;
    if (Date.now() > subData.expiryDate) {
        return false;
    }
    return true;
}

function activateSubscription(guildId, months) {
    const duration = months * 30 * 24 * 60 * 60 * 1000;
    const expiryDate = Date.now() + duration;
    db.set(`subscription_${guildId}`, {
        expiryDate: expiryDate,
        months: months,
        activatedAt: Date.now()
    });
}

module.exports = { checkSubscription, activateSubscription };
