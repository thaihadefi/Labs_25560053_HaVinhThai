const mongoose = require('mongoose');

const validateObjectId = (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: `Invalid ID format: ${id}` });
  }
  next();
};

module.exports = validateObjectId;
