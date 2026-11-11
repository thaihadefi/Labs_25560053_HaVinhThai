const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const HttpError = require('../utils/http-error');

const SALT_ROUNDS = 10;

// POST /api/v1/auth/register  body: { fullName, age, gender, email, password, type }
exports.register = async (req, res) => {
  const { fullName, age, gender, email, password, type } = req.body || {};

  if (typeof password !== 'string' || password.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters');
  }
  if (typeof email === 'string' && await User.exists({ email: email.trim().toLowerCase() })) {
    throw new HttpError(409, 'This email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ fullName, age, gender, email, passwordHash, type });

  res.status(201).json({ success: true, message: 'Account created successfully', data: user });
};

// POST /api/v1/auth/login  body: { email, password }
exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    throw new HttpError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  // Same message for an unknown email and a wrong password, so attackers cannot probe emails
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const token = jwt.sign(
    { id: user.id, type: user.type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  res.json({ success: true, message: 'Logged in successfully', data: { token, user } });
};

// GET /api/v1/auth/me (protected)
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(401, 'This account no longer exists');
  res.json({ success: true, data: user });
};
