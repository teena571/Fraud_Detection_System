import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import redisClient from '../config/redis.js'

/**
 * Redis-based rate limiter for production scalability
 * Falls back to memory store if Redis is unavailable
 */

// Global rate limiter - applies to all API routes
export const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  
  // Use Redis store if available, otherwise memory store
  store: redisClient.isConnected ? new RedisStore({
    // @ts-expect-error - Known issue with TypeScript definitions
    client: redisClient.client,
    prefix: 'rl:global:',
  }) : undefined,
  
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  
  // Skip rate limiting for certain conditions
  skip: (req) => {
    // Skip for health checks
    if (req.path === '/health') return true
    
    // Skip for whitelisted IPs (if configured)
    const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || []
    return whitelist.includes(req.ip)
  },
  
  // Custom key generator (use IP + user ID if authenticated)
  keyGenerator: (req) => {
    return req.user?.id ? `${req.ip}:${req.user.id}` : req.ip
  },
  
  // Handler for when limit is exceeded
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      limit: req.rateLimit.limit,
      current: req.rateLimit.current
    })
  }
})

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true, // Don't count successful requests
  
  store: redisClient.isConnected ? new RedisStore({
    // @ts-expect-error - Known issue with TypeScript definitions
    client: redisClient.client,
    prefix: 'rl:auth:',
  }) : undefined,
  
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes'
  },
  
  handler: (req, res) => {
    console.warn(`⚠️ Auth rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, account temporarily locked',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    })
  }
})

// Moderate rate limiter for write operations (POST/PUT/DELETE)
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  
  store: redisClient.isConnected ? new RedisStore({
    // @ts-expect-error - Known issue with TypeScript definitions
    client: redisClient.client,
    prefix: 'rl:write:',
  }) : undefined,
  
  message: {
    success: false,
    message: 'Too many write operations, please slow down',
    retryAfter: '1 minute'
  },
  
  skip: (req) => {
    // Only apply to write operations
    return !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)
  }
})

// Lenient rate limiter for read operations (GET)
export const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  
  store: redisClient.isConnected ? new RedisStore({
    // @ts-expect-error - Known issue with TypeScript definitions
    client: redisClient.client,
    prefix: 'rl:read:',
  }) : undefined,
  
  message: {
    success: false,
    message: 'Too many read requests, please slow down'
  },
  
  skip: (req) => {
    // Only apply to read operations
    return req.method !== 'GET'
  }
})

// Aggressive rate limiter for expensive operations
export const expensiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  
  store: redisClient.isConnected ? new RedisStore({
    // @ts-expect-error - Known issue with TypeScript definitions
    client: redisClient.client,
    prefix: 'rl:expensive:',
  }) : undefined,
  
  message: {
    success: false,
    message: 'This operation is rate limited, please try again later'
  }
})

// Custom rate limiter factory
export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000,
    max = 60,
    prefix = 'rl:custom:',
    message = 'Rate limit exceeded'
  } = options

  return rateLimit({
    windowMs,
    max,
    store: redisClient.isConnected ? new RedisStore({
      // @ts-expect-error - Known issue with TypeScript definitions
      client: redisClient.client,
      prefix,
    }) : undefined,
    message: {
      success: false,
      message
    }
  })
}

export default {
  globalLimiter,
  authLimiter,
  writeLimiter,
  readLimiter,
  expensiveLimiter,
  createRateLimiter
}
