// db.js - Shared connection and base user schema for the Exercise 3 extended questions
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_mongoose_db';

async function connectDB() {
  await mongoose.connect(MONGO_URI);
}

async function closeDB() {
  await mongoose.connection.close();
}

// The userSchema from mongoose_demo.js; each question file extends it before creating the model
function createUserSchema() {
  return new mongoose.Schema({
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
    },
    age: {
      type: Number,
      min: [18, 'User age must be at least 18'],
      max: [100, 'Invalid age']
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'manager'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }, {
    timestamps: true // Automatically add createdAt and updatedAt fields
  });
}

module.exports = { mongoose, connectDB, closeDB, createUserSchema };
