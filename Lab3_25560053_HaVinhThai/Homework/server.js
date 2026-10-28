// Main server entry point
require('dotenv').config({ quiet: true });
const express = require('express');
const pool = require('./config/db');
const setupSwagger = require('./config/swagger');
const orderRoutes = require('./routes/order.routes');
const customerRoutes = require('./routes/customer.routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

setupSwagger(app);

// Register API routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/customers', customerRoutes);

app.use(notFound);
app.use(errorHandler);

pool.query('SELECT 1')
  .then(() => {
    app.listen(PORT, () => console.log('Server API is running at: http://localhost:' + PORT));
  })
  .catch((err) => {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  });
