// Runs for every request, then hands control to the next handler
const logger = (req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
};

module.exports = logger;
