const mongoose = require('mongoose');
const toJsonOptions = require('../utils/to-json-options');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  age: {
    type: Number,
    min: [1, 'Age must be between 1 and 150'],
    max: [150, 'Age must be between 1 and 150']
  },
  gender: {
    type: String,
    enum: { values: ['male', 'female', 'other'], message: 'Gender must be male, female or other' },
    default: 'other'
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email is not valid']
  },
  passwordHash: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: { values: ['normal', 'admin'], message: "Type must be 'normal' or 'admin'" },
    default: 'normal'
  }
}, {
  timestamps: true,
  toJSON: toJsonOptions(['passwordHash']) // never send the password hash to a client
});

module.exports = mongoose.model('User', userSchema);
