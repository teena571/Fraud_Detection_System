import mongoose from 'mongoose'
import logger from './logger.js'

class Database {
  constructor() {
    this.connection = null
  }

  async connect() {
    try {
      const mongoURI = process.env.NODE_ENV === 'test' 
        ? process.env.MONGODB_TEST_URI 
        : process.env.MONGODB_URI

      if (!mongoURI) {
        throw new Error('MongoDB URI is not defined in environment variables')
      }

      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        retryWrites: true,
        w: 'majority'
      }

      this.connection = await mongoose.connect(mongoURI, options)

      logger.info(`MongoDB Connected: ${this.connection.connection.host}`)

      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err)
      })

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected')
      })

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected')
      })

      // Graceful shutdown
      process.on('SIGINT', this.gracefulShutdown.bind(this))
      process.on('SIGTERM', this.gracefulShutdown.bind(this))

      return this.connection
    } catch (error) {
      logger.error('Database connection failed:', error)
      process.exit(1)
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close()
        logger.info('MongoDB connection closed')
      }
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error)
    }
  }

  async gracefulShutdown() {
    logger.info('Received shutdown signal, closing MongoDB connection...')
    await this.disconnect()
    process.exit(0)
  }

  getConnectionState() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
    return states[mongoose.connection.readyState] || 'unknown'
  }

  async healthCheck() {
    try {
      const state = this.getConnectionState()
      if (state !== 'connected') {
        return { status: 'unhealthy', state }
      }

      // Ping database
      await mongoose.connection.db.admin().ping()
      return { status: 'healthy', state }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}

export default new Database()