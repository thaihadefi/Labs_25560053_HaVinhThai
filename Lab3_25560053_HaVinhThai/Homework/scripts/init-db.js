require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    multipleStatements: true
  });

  try {
    for (const file of ['schema.sql', 'seed.sql']) {
      const sql = fs.readFileSync(path.join(__dirname, '../database', file), 'utf8');
      await conn.query(sql);
      console.log(`Executed database/${file}`);
    }
    console.log('Database ecommerce_order_db is ready.');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
