const notFound = (req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Global error handler (must be registered AFTER the routes)
const errorHandler = (err, req, res, next) => {
  console.error('Server Error:', err.message);

  let status = err.status || 500;
  if (err.code === 'ER_DUP_ENTRY') status = 409; // duplicate unique key

  const message = status >= 500 ? 'Internal server error' : err.message;
  res.status(status).json({ success: false, error: message });
};

module.exports = { notFound, errorHandler };
