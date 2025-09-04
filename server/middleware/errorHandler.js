import { ValidationError } from 'sequelize';

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Sequelize validation error
  if (err instanceof ValidationError) {
    const message = err.errors.map(error => error.message).join(', ');
    error = {
      statusCode: 400,
      message: `Validation Error: ${message}`
    };
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value entered';
    error = {
      statusCode: 400,
      message
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      statusCode: 401,
      message
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      statusCode: 401,
      message
    };
  }

  // OpenAI API errors
  if (err.code === 'insufficient_quota') {
    error = {
      statusCode: 429,
      message: 'OpenAI API quota exceeded. Please try again later.'
    };
  }

  if (err.code === 'rate_limit_exceeded') {
    error = {
      statusCode: 429,
      message: 'Rate limit exceeded. Please try again later.'
    };
  }

  // Stripe errors
  if (err.type === 'StripeCardError') {
    error = {
      statusCode: 400,
      message: err.message || 'Payment failed'
    };
  }

  if (err.type === 'StripeInvalidRequestError') {
    error = {
      statusCode: 400,
      message: 'Invalid payment request'
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      statusCode: 400,
      message: 'File too large'
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      statusCode: 400,
      message: 'Too many files'
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
