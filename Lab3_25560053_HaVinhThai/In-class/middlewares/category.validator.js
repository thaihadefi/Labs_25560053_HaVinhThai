const slugify = require('../utils/slugify');

const MIN_NAME_LENGTH = 3;

const getNameError = (name) => {
  if (typeof name !== 'string' || name.trim() === '') return 'Category name is required';
  if (name.trim().length < MIN_NAME_LENGTH) {
    return `Category name must be at least ${MIN_NAME_LENGTH} characters`;
  }
  if (!slugify(name)) return 'Category name must contain at least one letter or digit';
  return null;
};

const rejectIfInvalid = (name, res, next) => {
  const error = getNameError(name);
  if (error) return res.status(400).json({ success: false, error });
  next();
};

exports.validateCategory = (req, res, next) => rejectIfInvalid(req.body?.name, res, next);

exports.validateCategoryPatch = (req, res, next) => {
  if (req.body?.name === undefined) return next();
  rejectIfInvalid(req.body.name, res, next);
};
