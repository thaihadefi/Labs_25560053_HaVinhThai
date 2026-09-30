// mongoose_demo.js - NoSQL data modeling with Mongoose ODM
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_mongoose_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log("-> Connected to MongoDB successfully via Mongoose ODM!"))
  .catch(err => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
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

userSchema.pre('save', function() {
  console.log(`[Middleware Pre-save] Preparing to save user: ${this.fullName}`);
});

const User = mongoose.model('User', userSchema);

async function runMongooseCRUD() {
  try {
    // Clear old data
    await User.deleteMany({});

    // --- C - CREATE ---
    const newUser = await User.create({
      fullName: "Nguyen Van Hung",
      email: "hung.nguyen@example.com",
      age: 22,
      role: "admin"
    });
    console.log("1. [CREATE] Successfully created new user:", newUser);

    // --- R - READ ---
    const foundUser = await User.findOne({ email: "hung.nguyen@example.com" });
    console.log("2. [READ] Found user by email:", foundUser.fullName);

    // --- U - UPDATE ---
    const updatedUser = await User.findByIdAndUpdate(
      newUser._id,
      { age: 23, role: "manager" },
      { returnDocument: 'after', runValidators: true } // Return the new document & enable validation
    );
    console.log("3. [UPDATE] Successfully updated user:", updatedUser);

    // --- D - DELETE ---
    // await User.findByIdAndDelete(newUser._id);
    // console.log("4. [DELETE] User deleted successfully.");
  } catch (error) {
    console.error("Mongoose validation/operation error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("-> Mongoose connection closed.");
  }
}

runMongooseCRUD();
