USE ecommerce_order_db;

INSERT INTO customers (full_name, email, phone) VALUES
  ('Nguyen Van Hung', 'hung.nguyen@example.com', '0901234567'),
  ('Tran Thi Mai', 'mai.tran@example.com', '0912345678'),
  ('Le Minh Tuan', 'tuan.le@example.com', '0923456789'),
  ('Pham Thu Ha', 'ha.pham@example.com', '0934567890'),
  ('Hoang Gia Bao', 'bao.hoang@example.com', '0945678901');

INSERT INTO products (product_name, price, stock) VALUES
  ('Laptop Dell XPS 15', 35000000.00, 10),
  ('Wireless Mouse', 250000.00, 50),
  ('Mechanical Keyboard', 1800000.00, 20),
  ('Sony WH-1000XM5 Headphones', 8500000.00, 8),
  ('USB-C Hub', 650000.00, 1);

INSERT INTO orders (customer_id, status, total_amount) VALUES
  (1, 'completed', 35500000.00),
  (2, 'completed', 1800000.00),
  (1, 'pending', 8500000.00),
  (3, 'cancelled', 3600000.00);

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 35000000.00),
  (1, 2, 2, 250000.00),
  (2, 3, 1, 1800000.00),
  (3, 4, 1, 8500000.00),
  (4, 3, 2, 1800000.00);
