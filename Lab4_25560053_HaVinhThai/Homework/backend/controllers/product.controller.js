const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const HttpError = require('../utils/http-error');

// categoryId is returned populated as { id, name } so the UI can show the category name
const POPULATE_CATEGORY = { path: 'categoryId', select: 'name' };

// Keeps only the writable fields and checks that the referenced category exists
async function readProductBody(body = {}) {
  const { name, categoryId, quantity, price } = body;
  const fields = { name, categoryId, quantity, price };
  Object.keys(fields).forEach((key) => fields[key] === undefined && delete fields[key]);

  if (fields.categoryId !== undefined) {
    if (!mongoose.isValidObjectId(fields.categoryId) || !(await Category.exists({ _id: fields.categoryId }))) {
      throw new HttpError(400, 'The selected category does not exist');
    }
  }
  return fields;
}

// GET /api/v1/products?categoryId=... (any logged-in user)
exports.getProducts = async (req, res) => {
  const filter = {};
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;

  const products = await Product.find(filter).populate(POPULATE_CATEGORY).sort({ createdAt: -1 });
  res.json({ success: true, count: products.length, data: products });
};

// POST /api/v1/products (admin)
exports.createProduct = async (req, res) => {
  const fields = await readProductBody(req.body);
  const product = await Product.create(fields);
  await product.populate(POPULATE_CATEGORY);
  res.status(201).json({ success: true, message: 'Product created', data: product });
};

// PUT /api/v1/products/:id (admin)
exports.updateProduct = async (req, res) => {
  const fields = await readProductBody(req.body);
  const product = await Product.findByIdAndUpdate(req.params.id, fields, { returnDocument: 'after', runValidators: true })
    .populate(POPULATE_CATEGORY);
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ success: true, message: 'Product updated', data: product });
};

// DELETE /api/v1/products/:id (admin)
exports.deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ success: true, message: 'Product deleted' });
};
