require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');

const DB_NAME = 'store_transaction_db';

const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
};

async function createDatabase() {
  const conn = await mysql.createConnection(connectionConfig);
  await conn.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
  await conn.end();
}

async function setupDatabaseAndSeedData(pool) {
  // Drop child tables first so the environment always resets to a known state
  await pool.query('DROP TABLE IF EXISTS order_items;');
  await pool.query('DROP TABLE IF EXISTS orders;');
  await pool.query('DROP TABLE IF EXISTS products;');
  await pool.query('DROP TABLE IF EXISTS customers;');

  await pool.query(`
    CREATE TABLE customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      balance DECIMAL(12,2) NOT NULL DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_name VARCHAR(150) NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      total_amount DECIMAL(12,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `);

  await pool.query(`
    CREATE TABLE order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  await pool.query(`
    INSERT INTO customers (full_name, balance) VALUES
      ('Nguyen Van Hung', 20000000.00),
      ('Tran Thi Mai', 1000000.00);
  `);

  await pool.query(`
    INSERT INTO products (product_name, price, stock) VALUES
      ('Smartphone', 5500000.00, 5),
      ('Wireless Mouse', 250000.00, 40),
      ('Mechanical Keyboard', 1800000.00, 2);
  `);
}

// items: [{ productId, quantity }]
async function placeOrder(pool, customerId, items) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Step 1: check the customer's balance and each product's stock.
    // FOR UPDATE locks the rows so no other transaction can change them before we commit.
    const [customers] = await conn.execute(
      'SELECT id, full_name, balance FROM customers WHERE id = ? FOR UPDATE',
      [customerId]
    );
    if (customers.length === 0) throw new Error(`Customer ${customerId} not found`);
    const customer = customers[0];

    const orderLines = [];
    let total = 0;
    for (const { productId, quantity } of items) {
      const [products] = await conn.execute(
        'SELECT id, product_name, price, stock FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );
      if (products.length === 0) throw new Error(`Product ${productId} not found`);
      const product = products[0];

      if (product.stock < quantity) {
        throw new Error(
          `Out of stock: "${product.product_name}" has ${product.stock} left, requested ${quantity}`
        );
      }
      orderLines.push({ productId, quantity, price: product.price });
      total += Number(product.price) * quantity;
    }

    if (Number(customer.balance) < total) {
      throw new Error(
        `Insufficient balance: ${customer.full_name} has ${customer.balance}, order total is ${total}`
      );
    }

    // Step 2: deduct the amount from the customer's balance
    await conn.execute(
      'UPDATE customers SET balance = balance - ? WHERE id = ?',
      [total, customerId]
    );

    // Step 3: deduct the quantity from each product's stock
    for (const { productId, quantity } of orderLines) {
      await conn.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [quantity, productId]
      );
    }

    // Step 4: insert the new order
    const [orderResult] = await conn.execute(
      'INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)',
      [customerId, total]
    );

    // Step 5: insert the order's line items
    for (const { productId, quantity, price } of orderLines) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderResult.insertId, productId, quantity, price]
      );
    }

    await conn.commit();
    console.log(`-> [COMMIT] Order ${orderResult.insertId} placed, total: ${total}`);
  } catch (error) {
    await conn.rollback();
    console.log(`-> [ROLLBACK] ${error.message}`);
  } finally {
    conn.release();
  }
}

async function printTables(pool, title) {
  console.log(`\n=== ${title} ===`);
  for (const table of ['customers', 'products', 'orders', 'order_items']) {
    const [rows] = await pool.query(`SELECT * FROM ${table}`);
    console.log(`${table}:`);
    console.table(rows);
  }
}

async function main() {
  let pool;
  try {
    await createDatabase();
    pool = mysql.createPool({
      ...connectionConfig,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    await setupDatabaseAndSeedData(pool);
    await printTables(pool, 'BEFORE');

    console.log('\nCase 1: valid order (Hung buys 2 Smartphones and 1 Wireless Mouse)');
    await placeOrder(pool, 1, [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }]);

    console.log('\nCase 2: insufficient balance (Mai buys 1 Smartphone)');
    await placeOrder(pool, 2, [{ productId: 1, quantity: 1 }]);

    console.log('\nCase 3: out of stock (Hung buys 3 Mechanical Keyboards)');
    await placeOrder(pool, 1, [{ productId: 3, quantity: 3 }]);

    await printTables(pool, 'AFTER');
  } catch (error) {
    console.error('MySQL error:', error.message);
  } finally {
    if (pool) await pool.end();
  }
}

main();
