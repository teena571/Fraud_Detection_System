import rateLimit from 'express-rate-limit'
import logger from '../config/logger.js'
import redisClient from '../config/redis.js'

// Create Redis store for rate limiting (if Redis is available)
const createRedisStore = () => {
  if (!redisClient.isConnected) {
    return undefined
  }

  return {
    incr: async (key) => {
      try {
        const current = await redisClient.get(key) || 0
        const newValue = parseInt(current) + 1
        await redisClient.set(key, newValue, 900) // 15 minutes
        return { totalHits: newValue, resetTime: new Date(Date.now() + 900000) }
      } catch (error) {
        logger.error('Redis rate limiter error:', error)
        return { totalHits: 1, resetTime: new Date(Date.now() + 900000) }
      }
    },
    decrement: async (key) => {
      try {
        const current = await redisClient.get(key) || 0
        const newValue = Math.max(0, parseInt(current) - 1)
        await redisClient.set(key, newValue, 900)
      } catch (error) {
        logger.error('Redis rate limiter decrement error:', error)
      }
    },
    resetKey: async (key) => {
      try {
        await redisClient.del(key)
      } catch (error) {
        logger.error('Redis rate limiter reset error:', error)
      }
    }
  }
}

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: createRedisStore(),
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for ${req.user?.id || req.ip} on ${req.path}`)
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() - Date.now()) / 1000
    })
  }
})

// Strict rate limiter for sensitive endpoints
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many attempts, please try again later'
  },
  store: createRedisStore(),
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    logger.warn(`Strict rate limit exceeded for ${req.user?.id || req.ip} on ${req.path}`)
    res.status(429).json({
      success: false,
      message: 'Too many attempts, please try again later'
    })
  }
})

// Login rate limiter
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  store: createRedisStore(),
  keyGenerator: (req) => {
    // Use email + IP for login attempts
    return `login:${req.body?.email || 'unknown'}:${req.ip}`
  },
  handler: (req, res) => {
    logger.warn(`Login rate limit exceeded for ${req.body?.email || 'unknown'} from ${req.ip}`)
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later'
    })
  }
})

// Create endpoint limiter
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 create requests per minute
  message: {
    success: false,
    message: 'Too many create requests, please slow down'
  },
  store: createRedisStore(),
  keyGenerator: (req) => `create:${req.user?.id || req.ip}`,
  handler: (req, res) => {
    logger.warn(`Create rate limit exceeded for ${req.user?.id || req.ip}`)
    res.status(429).json({
      success: false,
      message: 'Too many create requests, please slow down'
    })
  }
})

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each user to 5 uploads per minute
  message: {
    success: false,
    message: 'Too many file uploads, please wait before uploading again'
  },
  store: createRedisStore(),
  keyGenerator: (req) => `upload:${req.user?.id || req.ip}`,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for ${req.user?.id || req.ip}`)
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please wait'
    })
  }
})

// Dynamic rate limiter based on user role
export const dynamicLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: (req) => {
      // Higher limits for admin users
      if (req.user?.role === 'admin') {
        return options.adminMax || 1000
      }
      // Lower limits for regular users
      return options.userMax || 100
    },
    message: {
      success: false,
      message: 'Rate limit exceeded for your user level'
    },
    store: createRedisStore(),
    keyGenerator: (req) => `${req.user?.role || 'anonymous'}:${req.user?.id || req.ip}`
  })
}

// Default export - general API rate limiter
export default apiLimiter