import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const authenticate = asyncHandler(async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token

    if (!token) {
      throw new ApiError(401, 'Access token is required')
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // For demo purposes, create a mock user
    // In production, you would fetch the user from database
    req.user = {
      id: decoded.id || 'admin',
      email: decoded.email || 'admin@fraudshield.com',
      role: decoded.role || 'admin',
      permissions: decoded.permissions || ['read', 'write', 'delete', 'admin']
    }

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid access token')
    } else if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Access token expired')
    } else {
      throw new ApiError(401, 'Authentication failed')
    }
  }
})

// Mock authentication for development (when no JWT_SECRET is set)
export const mockAuthenticate = (req, res, next) => {
  req.user = {
    id: 'admin',
    email: 'admin@fraudshield.com',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin']
  }
  next()
}