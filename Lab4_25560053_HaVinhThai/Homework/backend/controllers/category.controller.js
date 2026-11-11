const Category = require('../models/category.model');
const Product = require('../models/product.model');
const HttpError = require('../utils/http-error');

// GET /api/v1/categories (any logged-in user)
exports.getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, count: categories.length, data: categories });
};

// POST /api/v1/categories (admin)
exports.createCategory = async (req, res) => {
  const category = await Category.create({ name: req.body?.name });
  res.status(201).json({ success: true, message: 'Category created', data: category });
};

// PUT /api/v1/categories/:id (admin)
exports.updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name: req.body?.name },
    { returnDocument: 'after', runValidators: true }
  );
  if (!category) throw new HttpError(404, 'Category not found');
  res.json({ success: true, message: 'Category updated', data: category });
};

// DELETE /api/v1/categories/:id (admin) – refused while products still reference it
exports.deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Category not found');

  const productCount = await Product.countDocuments({ categoryId: category._id });
  if (productCount > 0) {
    throw new HttpError(409, `Cannot delete "${category.name}": ${productCount} product(s) still use this category`);
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
};
