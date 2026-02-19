import { ApiError } from '../utils/ApiError.js'
import logger from '../config/logger.js'

const errorHandler = (err, req, res, next) => {
  let error = err

  // Log error details
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user?.id || 'anonymous'
  })

  // Convert known errors to ApiError
  if (!(error instanceof ApiError)) {
    let statusCode = 500
    let message = 'Internal Server Error'

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      statusCode = 400
      message = 'Validation Error'
      const errors = Object.values(err.errors).map(val => ({
        field: val.path,
        message: val.message,
        value: val.value
      }))
      error = new ApiError(statusCode, message, errors)
    }
    // Mongoose duplicate key error
    else if (err.code === 11000) {
      statusCode = 409
      message = 'Duplicate field value'
      const field = Object.keys(err.keyValue)[0]
      const errors = [{
        field,
        message: `${field} already exists`,
        value: err.keyValue[field]
      }]
      error = new ApiError(statusCode, message, errors)
    }
    // Mongoose cast error
    else if (err.name === 'CastError') {
      statusCode = 400
      message = 'Invalid data format'
      const errors = [{
        field: err.path,
        message: `Invalid ${err.kind} for field ${err.path}`,
        value: err.value
      }]
      error = new ApiError(statusCode, message, errors)
    }
    // JWT errors
    else if (err.name === 'JsonWebTokenError') {
      statusCode = 401
      message = 'Invalid token'
      error = new ApiError(statusCode, message)
    }
    else if (err.name === 'TokenExpiredError') {
      statusCode = 401
      message = 'Token expired'
      error = new ApiError(statusCode, message)
    }
    // Multer errors (file upload)
    else if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413
      message = 'File too large'
      error = new ApiError(statusCode, message)
    }
    else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      statusCode = 400
      message = 'Unexpected file field'
      error = new ApiError(statusCode, message)
    }
    // Rate limit error
    else if (err.statusCode === 429) {
      statusCode = 429
      message = 'Too many requests'
      error = new ApiError(statusCode, message)
    }
    // Default error
    else {
      error = new ApiError(statusCode, message, [], err.stack)
    }
  }

  // Prepare response
  const response = {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  }

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack
    response.details = error.errors || []
  }

  // Add validation errors if present
  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors
  }

  // Add request ID if available
  if (req.id) {
    response.requestId = req.id
  }

  // Send error response
  res.status(error.statusCode).json(response)
}

// 404 handler
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`)
  next(error)
}

// Async error handler wrapper
export const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit the process in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  // Exit the process as the application is in an undefined state
  process.exit(1)
})

export default errorHandler