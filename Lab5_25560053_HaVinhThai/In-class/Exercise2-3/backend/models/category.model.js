const mongoose = require('mongoose');
const toJsonOptions = require('../utils/to-json-options');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: toJsonOptions()
});

module.exports = mongoose.model('Category', categorySchema);
