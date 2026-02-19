import { ApiError } from '../utils/ApiError.js'

const errorHandler = (err, req, res, next) => {
  let error = err

  // If it's not an ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500
    const message = error.message || 'Something went wrong'
    error = new ApiError(statusCode, message, [], err.stack)
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      errors: error.errors
    })
  }

  // Send error response
  const response = {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString()
  }

  // Include additional error details in development
  if (process.env.NODE_ENV === 'development') {
    response.errors = error.errors
    response.stack = error.stack
  }

  // Include validation errors if present
  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors
  }

  res.status(error.statusCode).json(response)
}

export default errorHandler