const notFound = (req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Global error handler (must be registered AFTER the routes)
const errorHandler = (err, req, res, next) => {
  console.error('Server Error:', err.message);

  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') status = 400; // schema validation failed
  if (err.name === 'CastError') { // malformed ObjectId
    status = 400;
    message = `Invalid value for ${err.path}: ${JSON.stringify(err.value)}`;
  }
  if (err.code === 11000) { // duplicate unique key
    status = 409;
    const [field, value] = Object.entries(err.keyValue || {})[0] || [];
    message = field
      ? `A record with ${field} "${value}" already exists`
      : 'Duplicate value violates a unique constraint';
  }

  res.status(status).json({ success: false, error: message });
};

module.exports = { notFound, errorHandler };
