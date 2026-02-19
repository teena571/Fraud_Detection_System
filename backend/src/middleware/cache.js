import redisClient from '../config/redis.js'

/**
 * Cache middleware for GET requests
 * Caches response data for specified duration
 * Falls back to database if cache miss
 */
export const cacheMiddleware = (options = {}) => {
  const {
    ttl = 60, // Default 60 seconds
    keyPrefix = 'cache',
    includeQuery = true,
    includeUser = false
  } = options

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next()
    }

    // Skip if Redis is not connected
    if (!redisClient.isConnected) {
      return next()
    }

    try {
      // Generate cache key
      let cacheKey = `${keyPrefix}:${req.path}`
      
      // Include query parameters in cache key
      if (includeQuery && Object.keys(req.query).length > 0) {
        const sortedQuery = Object.keys(req.query)
          .sort()
          .map(key => `${key}=${req.query[key]}`)
          .join('&')
        cacheKey += `:${sortedQuery}`
      }
      
      // Include user ID in cache key (for user-specific data)
      if (includeUser && req.user?.id) {
        cacheKey += `:user:${req.user.id}`
      }

      // Try to get from cache
      const cachedData = await redisClient.get(cacheKey)
      
      if (cachedData) {
        // Cache hit - return cached data
        return res.json(cachedData)
      }

      // Cache miss - continue to controller
      // Override res.json to cache the response
      const originalJson = res.json.bind(res)
      
      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Cache the response asynchronously (don't wait)
          redisClient.set(cacheKey, data, ttl).catch(err => {
            console.error('Failed to cache response:', err.message)
          })
        }
        
        return originalJson(data)
      }

      next()
    } catch (error) {
      console.error('Cache middleware error:', error.message)
      // Continue without caching on error
      next()
    }
  }
}

/**
 * Invalidate cache by pattern
 * Use this after POST/PUT/DELETE operations
 */
export const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    // Store patterns for later invalidation
    res.locals.cacheInvalidationPatterns = patterns
    
    // Override res.json to invalidate cache after successful response
    const originalJson = res.json.bind(res)
    
    res.json = async (data) => {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache asynchronously
        for (const pattern of patterns) {
          try {
            await redisClient.delPattern(pattern)
          } catch (error) {
            console.error(`Failed to invalidate cache pattern ${pattern}:`, error.message)
          }
        }
      }
      
      return originalJson(data)
    }
    
    next()
  }
}

/**
 * Invalidate specific cache key
 */
export const invalidateCacheKey = (key) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res)
    
    res.json = async (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await redisClient.del(key)
        } catch (error) {
          console.error(`Failed to invalidate cache key ${key}:`, error.message)
        }
      }
      
      return originalJson(data)
    }
    
    next()
  }
}

/**
 * Clear all cache
 */
export const clearAllCache = async (req, res, next) => {
  try {
    await redisClient.flushAll()
    console.log('✅ All cache cleared')
  } catch (error) {
    console.error('Failed to clear cache:', error.message)
  }
  next()
}

export default {
  cacheMiddleware,
  invalidateCache,
  invalidateCacheKey,
  clearAllCache
}
