// jobs/dailyInventoryReport.js - one row per category: product count, total quantity and stock value
const cron = require('node-cron');
const Product = require('../models/product.model');
const Category = require('../models/category.model');

// Production: '0 0 * * *' (midnight). For testing set INVENTORY_REPORT_SCHEDULE='* * * * *' (every minute).
const SCHEDULE = process.env.INVENTORY_REPORT_SCHEDULE || '0 0 * * *';
const TIMEZONE = process.env.CRON_TIMEZONE || 'Asia/Ho_Chi_Minh';

function buildInventoryReport() {
  return Product.aggregate([
    {
      $group: {
        _id: '$categoryId',
        totalProducts: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        stockValue: { $sum: { $multiply: ['$price', '$quantity'] } }
      }
    },
    { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'category' } },
    {
      $project: {
        _id: 0,
        totalProducts: 1,
        totalQuantity: 1,
        stockValue: 1,
        category: { $ifNull: [{ $first: '$category.name' }, 'Unknown'] }
      }
    },
    { $sort: { stockValue: -1 } }
  ]);
}

function startDailyInventoryReportJob() {
  cron.schedule(SCHEDULE, async () => {
    console.log('[CRON] Running inventory report at', new Date().toISOString());
    try {
      const report = await buildInventoryReport();
      console.log('[CRON] Inventory by category:');
      console.table(report);
    } catch (error) {
      // The job runs inside the API process: never let it throw
      console.error('[CRON] Inventory report failed:', error.message);
    }
  }, { timezone: TIMEZONE });
  console.log(`[CRON] Inventory report scheduled: "${SCHEDULE}" (${TIMEZONE})`);
}

module.exports = { startDailyInventoryReportJob, buildInventoryReport };
