import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { createServer } from 'http'
import dotenv from 'dotenv'
import 'express-async-errors'

// Import configurations
import database from './src/config/database.js'
import redisClient from './src/config/redis.js'
import logger from './src/config/logger.js'

// Import services
import kafkaProducer from './src/kafka/producer.js'
import kafkaConsumer from './src/kafka/consumer.js'
import websocketService from './src/sockets/websocket.js'

// Import middleware
import errorHandler, { notFoundHandler } from './src/middlewares/errorHandler.js'
import rateLimiter from './src/middlewares/rateLimiter.js'

// Import routes
import healthRoutes from './src/routes/healthRoutes.js'
import transactionRoutes from './src/routes/transactionRoutes.js'
import authRoutes from './src/routes/authRoutes.js'

// Load environment variables
dotenv.config()

class Server {
  constructor() {
    this.app = express()
    this.server = null
    this.port = process.env.PORT || 4000
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }))

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }))

    // Compression
    this.app.use(compression())

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))
    this.app.use(cookieParser())

    // Logging middleware
    this.app.use(morgan('combined', { stream: logger.stream }))

    // Rate limiting
    this.app.use(rateLimiter)

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      res.setHeader('X-Request-ID', req.id)
      next()
    })

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        requestId: req.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      })
      next()
    })
  }

  setupRoutes() {
    // Health check routes
    this.app.use('/api/health', healthRoutes)

    // API routes
    this.app.use('/api/transactions', transactionRoutes)
    this.app.use('/api/auth', authRoutes)
    // this.app.use('/api/alerts', alertRoutes)
    // this.app.use('/api/rules', rulesRoutes)

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'FraudShield Backend',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        docs: '/api/health'
      })
    })

    // 404 handler
    this.app.use(notFoundHandler)

    // Global error handler
    this.app.use(errorHandler)
  }

  async connectServices() {
    try {
      // Connect to MongoDB
      await database.connect()

      // Connect to Redis (optional)
      if (process.env.REDIS_ENABLED === 'true') {
        await redisClient.connect()
      }

      // Connect to Kafka (optional)
      if (process.env.KAFKA_ENABLED === 'true') {
        await kafkaProducer.connect()
        await kafkaConsumer.connect()

        // Set up Kafka message handlers
        if (kafkaConsumer.isConnected) {
          await kafkaConsumer.subscribeToTransactionEvents(
            kafkaConsumer.handleTransactionMessage.bind(kafkaConsumer)
          )
          await kafkaConsumer.subscribeToAlertEvents(
            kafkaConsumer.handleAlertMessage.bind(kafkaConsumer)
          )
        }
      }

      logger.info('All services connected successfully')
    } catch (error) {
      logger.error('Failed to connect services:', error)
      throw error
    }
  }

  async start() {
    try {
      // Setup middleware and routes
      this.setupMiddleware()
      this.setupRoutes()

      // Create HTTP server
      this.server = createServer(this.app)

      // Initialize WebSocket server
      if (process.env.WS_ENABLED === 'true') {
        websocketService.initialize(this.server)
      }

      // Connect to external services
      await this.connectServices()

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`🚀 Server running on port ${this.port}`)
        logger.info(`📊 Environment: ${process.env.NODE_ENV}`)
        logger.info(`🔗 Health check: http://localhost:${this.port}/api/health`)
        
        if (process.env.WS_ENABLED === 'true') {
          logger.info(`🔌 WebSocket: ws://localhost:${this.port}${process.env.WS_PATH || '/ws'}`)
        }
      })

      // Graceful shutdown handlers
      this.setupGracefulShutdown()

    } catch (error) {
      logger.error('Failed to start server:', error)
      process.exit(1)
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`)

      // Stop accepting new connections
      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed')

          try {
            // Close WebSocket connections
            if (websocketService.wss) {
              websocketService.close()
            }

            // Disconnect from services
            await Promise.all([
              database.disconnect(),
              redisClient.disconnect(),
              kafkaProducer.disconnect(),
              kafkaConsumer.disconnect()
            ])

            logger.info('All services disconnected')
            process.exit(0)
          } catch (error) {
            logger.error('Error during graceful shutdown:', error)
            process.exit(1)
          }
        })
      }

      // Force exit after timeout
      setTimeout(() => {
        logger.error('Graceful shutdown timeout, forcing exit')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  }
}

// Start server
const server = new Server()
server.start().catch((error) => {
  logger.error('Failed to start application:', error)
  process.exit(1)
})

export default server