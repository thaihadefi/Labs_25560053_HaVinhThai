// Main server entry point
require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { UPLOAD_ROOT } = require('./middlewares/upload.middleware');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const User = require('./models/user.model');
const Category = require('./models/category.model');

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_admin_lab4_db';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set a long random secret.');
  process.exit(1);
}

const app = express();

// CORS_ORIGIN can list the allowed UI origins (comma-separated); any origin is allowed by default
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Uploaded avatars, e.g. http://localhost:4000/uploads/avatars/user-...png
app.use('/uploads', express.static(UPLOAD_ROOT));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);

app.use(notFound);
app.use(errorHandler);

mongoose.connect(MONGO_URI)
  .then(async () => {
    // Build the unique indexes (email, category name) before accepting requests
    await Promise.all([User.init(), Category.init()]);
    app.listen(PORT, () => console.log(`ShopAdmin API running at: http://localhost:${PORT}/api/v1`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
