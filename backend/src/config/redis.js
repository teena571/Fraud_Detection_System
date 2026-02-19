import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

class RedisClient {
  constructor() {
    this.client = null
    this.isConnected = false
  }

  async connect() {
    try {
      // Redis configuration
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false
      }

      this.client = new Redis(redisConfig)

      // Event handlers
      this.client.on('connect', () => {
        console.log('🔄 Redis connecting...')
      })

      this.client.on('ready', () => {
        console.log('✅ Redis connected and ready')
        this.isConnected = true
      })

      this.client.on('error', (error) => {
        console.error('❌ Redis error:', error.message)
        this.isConnected = false
      })

      this.client.on('close', () => {
        console.log('⚠️ Redis connection closed')
        this.isConnected = false
      })

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...')
      })

      // Wait for connection
      await this.client.ping()
      
      return this.client
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message)
      console.log('⚠️ Continuing without Redis cache...')
      this.isConnected = false
      return null
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit()
        console.log('✅ Redis disconnected')
      }
    } catch (error) {
      console.error('❌ Error disconnecting Redis:', error.message)
    }
  }

  // Get value from cache
  async get(key) {
    if (!this.isConnected) return null

    try {
      const value = await this.client.get(key)
      if (value) {
        console.log(`📦 Cache HIT: ${key}`)
        return JSON.parse(value)
      }
      console.log(`📭 Cache MISS: ${key}`)
      return null
    } catch (error) {
      console.error(`❌ Redis GET error for key ${key}:`, error.message)
      return null
    }
  }

  // Set value in cache with expiration (in seconds)
  async set(key, value, expirationInSeconds = 60) {
    if (!this.isConnected) return false

    try {
      const serialized = JSON.stringify(value)
      await this.client.setex(key, expirationInSeconds, serialized)
      console.log(`💾 Cache SET: ${key} (TTL: ${expirationInSeconds}s)`)
      return true
    } catch (error) {
      console.error(`❌ Redis SET error for key ${key}:`, error.message)
      return false
    }
  }

  // Delete specific key
  async del(key) {
    if (!this.isConnected) return false

    try {
      await this.client.del(key)
      console.log(`🗑️ Cache DELETE: ${key}`)
      return true
    } catch (error) {
      console.error(`❌ Redis DEL error for key ${key}:`, error.message)
      return false
    }
  }

  // Delete keys by pattern
  async delPattern(pattern) {
    if (!this.isConnected) return false

    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(...keys)
        console.log(`🗑️ Cache DELETE pattern: ${pattern} (${keys.length} keys)`)
      }
      return true
    } catch (error) {
      console.error(`❌ Redis DEL pattern error for ${pattern}:`, error.message)
      return false
    }
  }

  // Clear all cache
  async flushAll() {
    if (!this.isConnected) return false

    try {
      await this.client.flushdb()
      console.log('🗑️ Cache FLUSHED: All keys deleted')
      return true
    } catch (error) {
      console.error('❌ Redis FLUSH error:', error.message)
      return false
    }
  }

  // Check if key exists
  async exists(key) {
    if (!this.isConnected) return false

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key ${key}:`, error.message)
      return false
    }
  }

  // Get TTL (time to live) for a key
  async ttl(key) {
    if (!this.isConnected) return -1

    try {
      return await this.client.ttl(key)
    } catch (error) {
      console.error(`❌ Redis TTL error for key ${key}:`, error.message)
      return -1
    }
  }

  // Increment value
  async incr(key) {
    if (!this.isConnected) return null

    try {
      return await this.client.incr(key)
    } catch (error) {
      console.error(`❌ Redis INCR error for key ${key}:`, error.message)
      return null
    }
  }

  // Set with expiration at specific time
  async setWithExpireAt(key, value, timestamp) {
    if (!this.isConnected) return false

    try {
      const serialized = JSON.stringify(value)
      await this.client.set(key, serialized)
      await this.client.expireat(key, timestamp)
      console.log(`💾 Cache SET with EXPIREAT: ${key}`)
      return true
    } catch (error) {
      console.error(`❌ Redis SET with EXPIREAT error for key ${key}:`, error.message)
      return false
    }
  }

  // Get multiple keys
  async mget(keys) {
    if (!this.isConnected) return []

    try {
      const values = await this.client.mget(...keys)
      return values.map(value => value ? JSON.parse(value) : null)
    } catch (error) {
      console.error('❌ Redis MGET error:', error.message)
      return []
    }
  }

  // Set multiple keys
  async mset(keyValuePairs, expirationInSeconds = 60) {
    if (!this.isConnected) return false

    try {
      const pipeline = this.client.pipeline()
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serialized = JSON.stringify(value)
        pipeline.setex(key, expirationInSeconds, serialized)
      }
      
      await pipeline.exec()
      console.log(`💾 Cache MSET: ${Object.keys(keyValuePairs).length} keys`)
      return true
    } catch (error) {
      console.error('❌ Redis MSET error:', error.message)
      return false
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', message: 'Not connected' }
      }

      const start = Date.now()
      await this.client.ping()
      const latency = Date.now() - start

      const info = await this.client.info('memory')
      const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim()

      return {
        status: 'healthy',
        latency: `${latency}ms`,
        usedMemory: usedMemory || 'unknown',
        connected: true
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      }
    }
  }

  // Get cache statistics
  async getStats() {
    if (!this.isConnected) return null

    try {
      const info = await this.client.info()
      const stats = {}

      // Parse info string
      const lines = info.split('\r\n')
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':')
          stats[key] = value
        }
      }

      return {
        connected_clients: stats.connected_clients,
        used_memory_human: stats.used_memory_human,
        total_commands_processed: stats.total_commands_processed,
        keyspace_hits: stats.keyspace_hits,
        keyspace_misses: stats.keyspace_misses,
        hit_rate: stats.keyspace_hits && stats.keyspace_misses
          ? ((parseInt(stats.keyspace_hits) / (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses))) * 100).toFixed(2) + '%'
          : 'N/A'
      }
    } catch (error) {
      console.error('❌ Redis STATS error:', error.message)
      return null
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient()

export default redisClient