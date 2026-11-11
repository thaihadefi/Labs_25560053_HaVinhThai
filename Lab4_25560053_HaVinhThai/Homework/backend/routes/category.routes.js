const express = require('express');
const {
  getCategories, createCategory, updateCategory, deleteCategory
} = require('../controllers/category.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect); // every category route needs a logged-in user

router.get('/', getCategories);
router.post('/', adminOnly, createCategory);
router.put('/:id', adminOnly, updateCategory);
router.delete('/:id', adminOnly, deleteCategory);

module.exports = router;
