const { pool, setupDatabaseAndSeedData } = require('./db');

async function searchItemsByKeyword(keyword) {
  const [rows] = await pool.execute(
    'SELECT id, item_name, price, quantity FROM items WHERE item_name LIKE ?',
    [`%${keyword}%`]
  );
  return rows;
}

async function main() {
  try {
    await setupDatabaseAndSeedData(pool);

    const results = [];
    for (const keyword of ['Gaming', 'Wireless']) {
      const rows = await searchItemsByKeyword(keyword);
      results.push(...rows.map((row) => ({ keyword, ...row })));
    }
    console.table(results);
  } catch (error) {
    console.error('MySQL error:', error.message);
  } finally {
    await pool.end();
  }
}

main();
