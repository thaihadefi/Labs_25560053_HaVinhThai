// jobs/autoArchiveProducts.js - archive products that have been out of stock and untouched for a while
const cron = require('node-cron');
const Product = require('../models/product.model');

// Production: every hour, after 24 hours. For testing in class set
// ARCHIVE_SCHEDULE='* * * * *' and ARCHIVE_AFTER_MINUTES=2.
const SCHEDULE = process.env.ARCHIVE_SCHEDULE || '0 * * * *';
const rawMinutes = (process.env.ARCHIVE_AFTER_MINUTES || '').trim();
const configuredMinutes = Number(rawMinutes);
// The default applies only when the variable is unset/empty or not a valid number of minutes (0 is valid)
const AFTER_MINUTES = rawMinutes !== '' && Number.isFinite(configuredMinutes) && configuredMinutes >= 0
  ? configuredMinutes
  : 24 * 60;
const TIMEZONE = process.env.CRON_TIMEZONE || 'Asia/Ho_Chi_Minh';

async function archiveOutOfStockProducts(now = new Date()) {
  const cutoff = new Date(now.getTime() - AFTER_MINUTES * 60 * 1000);
  // Products created before the status field existed have no status, so match "not archived"
  const result = await Product.updateMany(
    { status: { $ne: 'archived' }, quantity: 0, updatedAt: { $lte: cutoff } },
    { $set: { status: 'archived' } }
  );
  return result.modifiedCount;
}

function startAutoArchiveJob() {
  cron.schedule(SCHEDULE, async () => {
    console.log('[CRON] Running auto-archive at', new Date().toISOString());
    try {
      const archived = await archiveOutOfStockProducts();
      // Logged even when zero: a silent job is impossible to debug later
      console.log(`[CRON] Auto-archive: ${archived} product(s) archived`);
    } catch (error) {
      console.error('[CRON] Auto-archive failed:', error.message);
    }
  }, { timezone: TIMEZONE });
  console.log(`[CRON] Auto-archive scheduled: "${SCHEDULE}", after ${AFTER_MINUTES} minute(s) at quantity 0 (${TIMEZONE})`);
}

module.exports = { startAutoArchiveJob, archiveOutOfStockProducts };
