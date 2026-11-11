const mongoose = require('mongoose');
const toJsonOptions = require('../utils/to-json-options');

const productSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: toJsonOptions()
});

module.exports = mongoose.model('Product', productSchema);
