// question3.js - Question 3 (Aggregate functions)
const { pool, setupDatabaseAndSeedData } = require('./db');

async function getItemStatistics() {
  const [rows] = await pool.execute(
    `SELECT SUM(quantity) AS total_quantity,
            AVG(price)    AS average_price,
            COUNT(*)      AS total_items
     FROM items`
  );
  return rows[0];
}

async function main() {
  try {
    await setupDatabaseAndSeedData(pool);

    console.table([await getItemStatistics()]);
  } catch (error) {
    console.error('MySQL error:', error.message);
  } finally {
    await pool.end();
  }
}

main();
