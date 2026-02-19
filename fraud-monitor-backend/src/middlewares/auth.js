import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import logger from '../config/logger.js'
import redisClient from '../config/redis.js'

export const authenticate = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from various sources
    let token = req.header('Authorization')?.replace('Bearer ', '') ||
                req.cookies?.token ||
                req.query?.token

    if (!token) {
      throw new ApiError(401, 'Access token is required')
    }

    // Check if token is blacklisted (if Redis is available)
    if (redisClient.isConnected) {
      const isBlacklisted = await redisClient.exists(`blacklist:${token}`)
      if (isBlacklisted) {
        throw new ApiError(401, 'Token has been revoked')
      }
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Check token expiration
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      throw new ApiError(401, 'Token has expired')
    }

    // Attach user info to request
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
      iat: decoded.iat,
      exp: decoded.exp
    }

    // Log authentication
    logger.debug(`User authenticated: ${req.user.id} (${req.user.role})`)

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid access token')
    } else if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Access token expired')
    } else if (error instanceof ApiError) {
      throw error
    } else {
      logger.error('Authentication error:', error)
      throw new ApiError(401, 'Authentication failed')
    }
  }
})

export const authorize = (roles = [], permissions = []) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required')
    }

    // Check roles
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id}: insufficient role (${req.user.role})`)
      throw new ApiError(403, `Access denied. Required role: ${roles.join(' or ')}`)
    }

    // Check permissions
    if (permissions.length > 0) {
      const hasPermission = permissions.some(permission => 
        req.user.permissions.includes(permission)
      )
      
      if (!hasPermission) {
        logger.warn(`Access denied for user ${req.user.id}: insufficient permissions`)
        throw new ApiError(403, `Access denied. Required permission: ${permissions.join(' or ')}`)
      }
    }

    next()
  })
}

export const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') ||
                  req.cookies?.token ||
                  req.query?.token

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role || 'user',
        permissions: decoded.permissions || []
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    logger.debug('Optional authentication failed:', error.message)
  }

  next()
})

export const generateToken = (payload, expiresIn = null) => {
  const options = {}
  
  if (expiresIn) {
    options.expiresIn = expiresIn
  } else if (process.env.JWT_EXPIRES_IN) {
    options.expiresIn = process.env.JWT_EXPIRES_IN
  }

  return jwt.sign(payload, process.env.JWT_SECRET, options)
}

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

export const blacklistToken = async (token) => {
  try {
    if (!redisClient.isConnected) {
      logger.warn('Cannot blacklist token: Redis not connected')
      return false
    }

    const decoded = jwt.decode(token)
    const expiresIn = decoded.exp ? (decoded.exp - Math.floor(Date.now() / 1000)) : 86400

    if (expiresIn > 0) {
      await redisClient.set(`blacklist:${token}`, true, expiresIn)
      logger.info(`Token blacklisted for user: ${decoded.id}`)
      return true
    }
    
    return false
  } catch (error) {
    logger.error('Error blacklisting token:', error)
    return false
  }
}

// Mock authentication for development/testing
export const mockAuth = (req, res, next) => {
  req.user = {
    id: 'mock-user-id',
    email: 'admin@fraudshield.com',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin']
  }
  next()
}