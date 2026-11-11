const express = require('express');
const {
  getProducts, createProduct, updateProduct, deleteProduct
} = require('../controllers/product.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect); // every product route needs a logged-in user

router.get('/', getProducts);
router.post('/', adminOnly, createProduct);
router.put('/:id', adminOnly, updateProduct);
router.delete('/:id', adminOnly, deleteProduct);

module.exports = router;
