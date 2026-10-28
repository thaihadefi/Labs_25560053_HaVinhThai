const pool = require('../config/db');
const HttpError = require('../utils/http-error');
const withTransaction = require('../utils/with-transaction');

async function lockOrder(conn, orderId) {
  const [rows] = await conn.query('SELECT id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
  if (rows.length === 0) throw new HttpError(404, `Order with id ${orderId} not found`);
  return rows[0];
}

async function restoreStock(conn, orderId) {
  await conn.query(
    `UPDATE products p
     JOIN (
       SELECT product_id, SUM(quantity) AS quantity
       FROM order_items
       WHERE order_id = ?
       GROUP BY product_id
     ) oi ON oi.product_id = p.id
     SET p.stock = p.stock + oi.quantity`,
    [orderId]
  );
}

async function createOrder(customerId, items) {
  const quantities = new Map();
  for (const { productId, quantity } of items) {
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }
  const productIds = [...quantities.keys()].sort((a, b) => a - b);

  const orderId = await withTransaction(async (conn) => {
    const [customers] = await conn.query('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (customers.length === 0) throw new HttpError(404, `Customer with id ${customerId} not found`);

    // SELECT ... FOR UPDATE locks the product rows until commit,
    // so two orders cannot buy the same last item at the same time
    const [products] = await conn.query(
      'SELECT id, product_name, price, stock FROM products WHERE id IN (?) ORDER BY id FOR UPDATE',
      [productIds]
    );
    const productsById = new Map(products.map((product) => [product.id, product]));

    let totalCents = 0;
    const orderLines = [];
    for (const productId of productIds) {
      const product = productsById.get(productId);
      if (!product) throw new HttpError(404, `Product with id ${productId} not found`);

      const quantity = quantities.get(productId);
      if (product.stock < quantity) {
        throw new HttpError(
          400,
          `Product ${product.product_name} is out of stock (requested ${quantity}, available ${product.stock})`
        );
      }
      totalCents += Math.round(product.price * 100) * quantity;
      orderLines.push({ productId, quantity, unitPrice: product.price });
    }

    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)',
      [customerId, totalCents / 100]
    );
    const newOrderId = orderResult.insertId;

    await conn.query(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?',
      [orderLines.map((line) => [newOrderId, line.productId, line.quantity, line.unitPrice])]
    );

    for (const line of orderLines) {
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [line.quantity, line.productId]);
    }
    return newOrderId;
  });

  return getOrderById(orderId);
}

async function listOrders({ status, customerId, limit, offset }) {
  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('o.status = ?');
    params.push(status);
  }
  if (customerId) {
    conditions.push('o.customer_id = ?');
    params.push(customerId);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ totalOrders }]] = await pool.query(
    `SELECT COUNT(*) AS totalOrders FROM orders o ${where}`,
    params
  );
  const [orders] = await pool.query(
    `SELECT o.id AS order_id,
            c.full_name AS customer_name,
            c.email,
            o.status,
            o.total_amount,
            COALESCE(SUM(oi.quantity), 0) AS total_items_count,
            o.created_at
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     ${where}
     GROUP BY o.id, c.id
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return { orders, totalOrders };
}

async function getOrderById(orderId) {
  const [rows] = await pool.query(
    `SELECT o.id, o.status, o.total_amount, o.created_at,
            c.id AS customer_id, c.full_name, c.email, c.phone,
            oi.product_id, p.product_name, oi.quantity, oi.unit_price,
            oi.quantity * oi.unit_price AS subtotal
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.id = ?
     ORDER BY oi.id`,
    [orderId]
  );
  if (rows.length === 0) throw new HttpError(404, `Order with id ${orderId} not found`);

  const [first] = rows;
  return {
    id: first.id,
    status: first.status,
    total_amount: first.total_amount,
    created_at: first.created_at,
    customer: {
      id: first.customer_id,
      full_name: first.full_name,
      email: first.email,
      phone: first.phone
    },
    items: rows
      .filter((row) => row.product_id !== null)
      .map((row) => ({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: row.quantity,
        unit_price: row.unit_price,
        subtotal: row.subtotal
      }))
  };
}

async function updateOrderStatus(orderId, status) {
  await withTransaction(async (conn) => {
    const order = await lockOrder(conn, orderId);
    if (order.status === 'cancelled') {
      throw new HttpError(400, `Order ${orderId} is already cancelled and its status cannot be changed`);
    }
    if (status === 'cancelled') await restoreStock(conn, orderId);
    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
  });
  return getOrderById(orderId);
}

async function deleteOrder(orderId) {
  return withTransaction(async (conn) => {
    const order = await lockOrder(conn, orderId);
    const stockRestored = order.status !== 'cancelled';
    if (stockRestored) await restoreStock(conn, orderId);
    await conn.query('DELETE FROM orders WHERE id = ?', [orderId]);
    return { id: orderId, previousStatus: order.status, stockRestored };
  });
}

async function getSalesSummary() {
  const [[summary]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue,
            COUNT(*) AS completedOrdersCount,
            COALESCE(ROUND(AVG(total_amount), 2), 0) AS averageOrderValue
     FROM orders
     WHERE status = 'completed'`
  );
  const [topSellingProducts] = await pool.query(
    `SELECT p.id AS product_id,
            p.product_name,
            SUM(oi.quantity) AS total_quantity_sold,
            SUM(oi.quantity * oi.unit_price) AS total_revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE o.status = 'completed'
     GROUP BY p.id, p.product_name
     ORDER BY total_quantity_sold DESC, total_revenue DESC, p.id
     LIMIT 3`
  );
  return { ...summary, topSellingProducts };
}

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getSalesSummary
};
