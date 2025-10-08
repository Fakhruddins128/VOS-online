// Custom error class for application-specific errors
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database error handler
const handleDatabaseError = (error) => {
  let message = 'Database operation failed';
  let statusCode = 500;

  // Handle specific database errors
  if (error.code === 'EREQUEST') {
    message = 'Invalid database request';
    statusCode = 400;
  } else if (error.code === 'ELOGIN') {
    message = 'Database authentication failed';
    statusCode = 500;
  } else if (error.code === 'ETIMEOUT') {
    message = 'Database connection timeout';
    statusCode = 503;
  } else if (error.code === 'ECONNRESET') {
    message = 'Database connection was reset';
    statusCode = 503;
  } else if (error.message && error.message.includes('duplicate key')) {
    message = 'Duplicate entry found';
    statusCode = 409;
  } else if (error.message && error.message.includes('foreign key')) {
    message = 'Referenced record not found';
    statusCode = 400;
  }

  return new AppError(message, statusCode);
};

// Validation error handler
const handleValidationError = (error) => {
  const message = 'Invalid input data';
  return new AppError(message, 400);
};

// Cast error handler (for invalid IDs, etc.)
const handleCastError = (error) => {
  const message = 'Invalid data format';
  return new AppError(message, 400);
};

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong!',
      timestamp: new Date().toISOString()
    });
  }
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.code && (err.code.startsWith('E') || err.number)) {
      error = handleDatabaseError(error);
    } else if (err.name === 'ValidationError') {
      error = handleValidationError(error);
    } else if (err.name === 'CastError') {
      error = handleCastError(error);
    }

    sendErrorProd(error, res);
  }
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

// Graceful shutdown handler
const gracefulShutdown = (server) => {
  return (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    
    server.close(() => {
      console.log('💥 Process terminated!');
      process.exit(0);
    });
    
    // Force close server after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

module.exports = {
  AppError,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler,
  gracefulShutdown
};