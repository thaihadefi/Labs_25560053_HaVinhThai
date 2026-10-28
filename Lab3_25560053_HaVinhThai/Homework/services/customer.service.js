const pool = require('../config/db');
const HttpError = require('../utils/http-error');

async function getOrderHistory(customerId) {
  const [customers] = await pool.query(
    'SELECT id, full_name, email, phone, created_at FROM customers WHERE id = ?',
    [customerId]
  );
  if (customers.length === 0) throw new HttpError(404, `Customer with id ${customerId} not found`);

  const [orders] = await pool.query(
    `SELECT o.id AS order_id,
            o.status,
            o.total_amount,
            COALESCE(SUM(oi.quantity), 0) AS total_items_count,
            o.created_at
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.customer_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC, o.id DESC`,
    [customerId]
  );

  const [[{ totalLifetimeSpent }]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS totalLifetimeSpent
     FROM orders
     WHERE customer_id = ? AND status = 'completed'`,
    [customerId]
  );

  return { customer: customers[0], totalLifetimeSpent, totalOrders: orders.length, orders };
}

module.exports = { getOrderHistory };
