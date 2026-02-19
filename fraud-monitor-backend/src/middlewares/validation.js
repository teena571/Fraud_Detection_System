import { validationResult } from 'express-validator'
import { ApiError } from '../utils/ApiError.js'

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }))
    
    throw new ApiError(400, 'Validation failed', errorMessages)
  }
  
  next()
}

export const sanitizeInput = (req, res, next) => {
  // Remove null bytes and trim strings
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '').trim()
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    } else if (obj && typeof obj === 'object') {
      const sanitized = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value)
      }
      return sanitized
    }
    return obj
  }

  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query)
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params)
  }

  next()
}