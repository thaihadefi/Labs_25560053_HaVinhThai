// Main server entry point
require('dotenv').config({ quiet: true });
const express = require('express');
const mongoose = require('mongoose');
const logger = require('./middlewares/logger.middleware');
const setupSwagger = require('./config/swagger');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const Category = require('./models/category.model');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_lab3_db';

app.use(express.json());
app.use(logger);

setupSwagger(app);

// Register API routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

app.use(notFound);
app.use(errorHandler);

mongoose.connect(MONGO_URI)
  .then(async () => {
    await Category.init();
    app.listen(PORT, () => console.log('Server API is running at: http://localhost:' + PORT));
  })
  .catch((err) => console.error('MongoDB connection failed:', err.message));
