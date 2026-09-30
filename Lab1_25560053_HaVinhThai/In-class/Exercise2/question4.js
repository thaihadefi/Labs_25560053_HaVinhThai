const { pool, setupDatabaseAndSeedData } = require('./db');

async function getCategoryStatistics(minValue) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name,
            COUNT(i.id)                 AS total_items,
            SUM(i.price * i.quantity)   AS total_inventory_value
     FROM categories c
     JOIN items i ON i.category_id = c.id
     GROUP BY c.id, c.name
     HAVING total_inventory_value > ?
     ORDER BY total_inventory_value DESC`,
    [minValue]
  );
  return rows;
}

async function main() {
  try {
    await setupDatabaseAndSeedData(pool);

    console.table(await getCategoryStatistics(10000000));
  } catch (error) {
    console.error('MySQL error:', error.message);
  } finally {
    await pool.end();
  }
}

main();
