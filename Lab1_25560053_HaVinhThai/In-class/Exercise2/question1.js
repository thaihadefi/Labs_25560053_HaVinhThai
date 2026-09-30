const { pool, setupDatabaseAndSeedData } = require('./db');

async function getExpensiveInStockItems(minPrice) {
  const [rows] = await pool.execute(
    `SELECT id, item_name, price, quantity
     FROM items
     WHERE price >= ? AND quantity > 0
     ORDER BY price DESC`,
    [minPrice]
  );
  return rows;
}

async function main() {
  try {
    await setupDatabaseAndSeedData(pool);

    console.table(await getExpensiveInStockItems(500000));
  } catch (error) {
    console.error('MySQL error:', error.message);
  } finally {
    await pool.end();
  }
}

main();
