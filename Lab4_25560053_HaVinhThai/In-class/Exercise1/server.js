const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// CORS: allow a Web UI on another origin to call this API
app.use(cors({
  origin: '*', // in production, list the exact origins, e.g. 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Simulated in-memory database
let products = [
  { id: 1, name: 'Laptop Dell XPS 15', price: 35000000, category: 'Electronics' },
  { id: 2, name: 'Logitech MX Master 3S Mouse', price: 2400000, category: 'Accessories' }
];

// Shared validation for create and update; returns an error message or null
function validateProduct({ name, price }) {
  if (typeof name !== 'string' || !name.trim() || price === undefined || price === '') {
    return 'Product name and price are required!';
  }
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return 'Price must be a positive number!';
  }
  return null;
}

// GET - list all products, optionally filtered with ?category=Electronics
app.get('/api/v1/products', (req, res) => {
  const { category } = req.query;
  const data = category
    ? products.filter(p => p.category.toLowerCase() === String(category).toLowerCase())
    : products;
  res.json({ success: true, count: data.length, data });
});

// POST - create a product
app.post('/api/v1/products', (req, res) => {
  const { name, price, category } = req.body || {};
  const error = validateProduct({ name, price });
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }
  const newProduct = {
    id: Date.now(),
    name: name.trim(),
    price: Number(price),
    category: (category && String(category).trim()) || 'General'
  };
  products.push(newProduct);
  res.status(201).json({ success: true, message: 'Product added successfully', data: newProduct });
});

// PUT - replace a product's name, price and category
app.put('/api/v1/products/:id', (req, res) => {
  const productId = Number(req.params.id);
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, message: `Product ID ${productId} not found` });
  }
  const { name, price, category } = req.body || {};
  const error = validateProduct({ name, price });
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }
  product.name = name.trim();
  product.price = Number(price);
  product.category = (category && String(category).trim()) || 'General';
  res.json({ success: true, message: `Updated product ID ${productId}`, data: product });
});

// DELETE - remove a product by id
app.delete('/api/v1/products/:id', (req, res) => {
  const productId = Number(req.params.id);
  const exists = products.some(p => p.id === productId);
  if (!exists) {
    return res.status(404).json({ success: false, message: `Product ID ${productId} not found` });
  }
  products = products.filter(p => p.id !== productId);
  res.json({ success: true, message: `Deleted product ID ${productId}` });
});

app.listen(PORT, () => {
  console.log(`Backend API running at: http://localhost:${PORT}`);
});
