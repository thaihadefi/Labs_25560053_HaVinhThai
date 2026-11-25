// Main server entry point
require('dotenv').config({ quiet: true });
const http = require('http');
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
const { initSocket } = require('./socket');
const { startDailyInventoryReportJob } = require('./jobs/dailyInventoryReport');
const { startAutoArchiveJob } = require('./jobs/autoArchiveProducts');

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_admin_lab5_db';

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

// Socket.IO needs the raw http.Server, so listen on it instead of app.listen
const httpServer = http.createServer(app);
const io = initSocket(httpServer);
app.set('io', io); // controllers read it with req.app.get('io')

mongoose.connect(MONGO_URI)
  .then(async () => {
    // Build the unique indexes (email, category name) before accepting requests
    await Promise.all([User.init(), Category.init()]);

    // Start the cron jobs only once MongoDB is connected, and on a single instance
    // if PM2 ever runs this app in cluster mode (otherwise every worker runs each job)
    if (process.env.NODE_APP_INSTANCE === undefined || process.env.NODE_APP_INSTANCE === '0') {
      startDailyInventoryReportJob();
      startAutoArchiveJob();
    }

    httpServer.listen(PORT, () => console.log(`ShopAdmin API (HTTP + Socket.IO) running at: http://localhost:${PORT}/api/v1`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
