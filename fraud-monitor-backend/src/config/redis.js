import { createClient } from 'redis'
import logger from './logger.js'

class RedisClient {
  constructor() {
    this.client = null
    this.isConnected = false
  }

  async connect() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        db: parseInt(process.env.REDIS_DB) || 0
      }

      if (process.env.REDIS_PASSWORD) {
        redisConfig.password = process.env.REDIS_PASSWORD
      }

      this.client = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port
        },
        password: redisConfig.password,
        database: redisConfig.db,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis server connection refused')
            return new Error('Redis server connection refused')
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted')
            return new Error('Retry time exhausted')
          }
          if (options.attempt > 10) {
            logger.error('Redis max retry attempts reached')
            return undefined
          }
          return Math.min(options.attempt * 100, 3000)
        }
      })

      // Event handlers
      this.client.on('connect', () => {
        logger.info('Redis client connected')
      })

      this.client.on('ready', () => {
        logger.info('Redis client ready')
        this.isConnected = true
      })

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err)
        this.isConnected = false
      })

      this.client.on('end', () => {
        logger.info('Redis client disconnected')
        this.isConnected = false
      })

      await this.client.connect()
      return this.client
    } catch (error) {
      logger.error('Redis connection failed:', error)
      // Don't exit process, Redis is optional
      return null
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit()
        logger.info('Redis connection closed')
      }
    } catch (error) {
      logger.error('Error closing Redis connection:', error)
    }
  }

  async set(key, value, expireInSeconds = null) {
    try {
      if (!this.isConnected) return false
      
      const serializedValue = JSON.stringify(value)
      if (expireInSeconds) {
        await this.client.setEx(key, expireInSeconds, serializedValue)
      } else {
        await this.client.set(key, serializedValue)
      }
      return true
    } catch (error) {
      logger.error('Redis SET error:', error)
      return false
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) return null
      
      const value = await this.client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error('Redis GET error:', error)
      return null
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return false
      
      await this.client.del(key)
      return true
    } catch (error) {
      logger.error('Redis DEL error:', error)
      return false
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) return false
      
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Redis EXISTS error:', error)
      return false
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', message: 'Not connected' }
      }
      
      await this.client.ping()
      return { status: 'healthy' }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}

export default new RedisClient()