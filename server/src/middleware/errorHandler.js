
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Set defaults
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate Key Error',
      details: `${Object.keys(err.keyValue)} already exists`
    });
  }
  
  // General error response
  return res.status(status).json({
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
