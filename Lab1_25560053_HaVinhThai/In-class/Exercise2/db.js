// db.js - Shared connection pool and sample data for the Exercise 2 extended questions
require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function setupDatabaseAndSeedData(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create the items table with a foreign key referencing categories
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      item_name VARCHAR(150) NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      quantity INT DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );
  `);

  // Clear old data so the environment always resets to a known state
  await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
  await pool.query('TRUNCATE TABLE items;');
  await pool.query('TRUNCATE TABLE categories;');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

  // Seed the categories table
  await pool.query(`
    INSERT INTO categories (name, description) VALUES
      ('Food', 'Daily essentials and groceries'),
      ('Electronics', 'Gadgets, phones and computers'),
      ('Clothing', 'Apparel and fashion items'),
      ('Books', 'Educational and entertainment books'),
      ('Home & Living', 'Furniture and home appliances'),
      ('Sports & Outdoors', 'Sporting goods and outdoor equipment');
  `);

  // Seed the items table
  // Note: 'Sports & Outdoors' intentionally has no items, for the
  // LEFT JOIN exercise (Question 5).
  await pool.query(`
    INSERT INTO items (category_id, item_name, price, quantity) VALUES
      (1, 'Apple', 25000.00, 100),
      (1, 'Milk', 32000.00, 50),
      (1, 'Bread', 15000.00, 30),
      (2, 'Smartphone', 5500000.00, 15),
      (2, 'Wireless Mouse', 250000.00, 40),
      (3, 'T-Shirt', 120000.00, 60),
      (3, 'Jeans', 350000.00, 25),
      (4, 'Node.js Programming', 180000.00, 20),
      (5, 'Desk Lamp', 150000.00, 35),
      (5, 'Coffee Mug', 45000.00, 80);
  `);
}

module.exports = { pool, setupDatabaseAndSeedData };
