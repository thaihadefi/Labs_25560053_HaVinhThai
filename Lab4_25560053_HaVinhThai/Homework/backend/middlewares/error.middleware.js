const multer = require('multer');

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Global error handler (registered after the routes): every error becomes JSON
// with a `message` field, which the UI shows in its error toast.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'The file is too large (max 2 MB)!' : err.message;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}: ${JSON.stringify(err.value)}`;
  } else if (err.code === 11000) {
    status = 409;
    const [field, value] = Object.entries(err.keyValue || {})[0] || [];
    message = field ? `A record with ${field} "${value}" already exists` : 'Duplicate value';
  }

  if (status >= 500) console.error('Server Error:', err);
  res.status(status).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
