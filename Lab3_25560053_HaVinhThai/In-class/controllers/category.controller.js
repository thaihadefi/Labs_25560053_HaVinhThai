const Category = require('../models/category.model');
const slugify = require('../utils/slugify');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const SORTABLE_FIELDS = ['name', 'createdAt', 'updatedAt'];

const parseSort = (sort = '-createdAt') => {
  if (typeof sort !== 'string') return null;
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  if (!SORTABLE_FIELDS.includes(field)) return null;
  return { [field]: descending ? -1 : 1, _id: 1 };
};

const pickCategoryFields = (body = {}) => {
  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  return data;
};

// 1. GET /api/categories - List categories (pagination & sorting)
exports.getAllCategories = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const sort = parseSort(req.query.sort);
    if (!sort) {
      return res.status(400).json({
        success: false,
        error: `Invalid sort field. Allowed: ${SORTABLE_FIELDS.join(', ')} (prefix with "-" for descending)`
      });
    }

    const totalCategories = await Category.countDocuments();
    const categories = await Category.find().sort(sort).skip(skip).limit(limit);

    res.status(200).json({
      success: true,
      count: categories.length,
      pagination: buildPaginationMeta(page, limit, totalCategories, 'totalCategories'),
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/categories/:id - Get category details by ID
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'No category found with the given ID' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// 3. POST /api/categories - Create a new category (slug is set by the pre('save') hook)
exports.createCategory = async (req, res, next) => {
  try {
    const newCategory = await Category.create(pickCategoryFields(req.body));
    res.status(201).json({ success: true, message: 'Category created successfully', data: newCategory });
  } catch (error) {
    next(error);
  }
};

// 4. PUT /api/categories/:id - Replace a category (fields not sent are removed)
exports.replaceCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'No category found to update' });
    }
    category.overwrite(pickCategoryFields(req.body));
    await category.save();
    res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
  } catch (error) {
    next(error);
  }
};

// 5. PATCH /api/categories/:id - Partially update a category
exports.updateCategory = async (req, res, next) => {
  try {
    const updates = pickCategoryFields(req.body);
    if (updates.name !== undefined) updates.slug = slugify(updates.name);

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'No category found to update' });
    }
    res.status(200).json({ success: true, message: 'Category updated successfully', data: updatedCategory });
  } catch (error) {
    next(error);
  }
};

// 6. DELETE /api/categories/:id - Delete a category by ID
exports.deleteCategory = async (req, res, next) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: 'No category found to delete' });
    }
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
