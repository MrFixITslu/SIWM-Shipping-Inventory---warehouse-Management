
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass error to the next error handling middleware
};

// General error handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Sometimes you might get errors with statusCodes already set (e.g. from other middleware)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    // Provide stack trace only in development mode for debugging
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
    