import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { createServer } from 'http'
import dotenv from 'dotenv'

// Import configurations and services
import connectDB from './src/config/database.js'
import redisClient from './src/config/redis.js'
import { createTopics } from './src/config/kafka.js'
import kafkaProducer from './src/services/kafkaProducer.js'
import kafkaConsumer from './src/services/kafkaConsumer.js'
import websocketService from './src/services/websocketService.js'

// Import middleware
import errorHandler from './src/middleware/errorHandler.js'
import { authenticate, mockAuthenticate } from './src/middleware/auth.js'
import { globalLimiter, writeLimiter } from './src/middleware/rateLimiter.js'
import { responseTimeLogger, statsEndpoint } from './src/middleware/responseTime.js'
import { compressionMiddleware, compressionLogger } from './src/middleware/compression.js'
import { securityMiddleware, additionalSecurityHeaders, sanitizeRequest } from './src/middleware/security.js'

// Import routes
import transactionRoutes from './src/routes/transactionRoutes.js'
import alertRoutes from './src/routes/alertRoutes.js'
import adminRoutes from './src/routes/adminRoutes.js'
import activityLogRoutes from './src/routes/activityLogRoutes.js'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 4000

// Trust proxy (important for rate limiting and IP detection behind reverse proxy)
app.set('trust proxy', 1)

// Response time tracking (must be first)
app.use(responseTimeLogger)

// Security middleware
app.use(securityMiddleware)
app.use(additionalSecurityHeaders)

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Response-Time', 'X-RateLimit-Limit', 'X-RateLimit-Remaining']
}))

// Compression middleware (before routes)
if (process.env.NODE_ENV === 'development') {
  app.use(compressionLogger)
}
app.use(compressionMiddleware)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request sanitization
app.use(sanitizeRequest)

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Global rate limiting (applies to all routes)
app.use('/api/', globalLimiter)

// Write operation rate limiting (POST/PUT/DELETE)
app.use('/api/', writeLimiter)

// Health check endpoint
app.get('/health', async (req, res) => {
  const redisHealth = await redisClient.healthCheck()
  
  res.json({
    success: true,
    message: 'FraudShield API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    },
    services: {
      redis: redisHealth,
      kafka: process.env.KAFKA_ENABLED === 'true' ? 'enabled' : 'disabled'
    }
  })
})

// Performance statistics endpoint (admin only)
app.get('/api/stats', authenticate, statsEndpoint)

// API routes
app.use('/api/transactions', transactionRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin/activity', activityLogRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
})

// Global error handler
app.use(errorHandler)

// Initialize services
const startServer = async () => {
  try {
    // Connect to database
    await connectDB()
    
    // Initialize Redis (if enabled)
    if (process.env.REDIS_ENABLED !== 'false') {
      try {
        console.log('🔄 Initializing Redis...')
        await redisClient.connect()
        console.log('✅ Redis initialized successfully')
      } catch (redisError) {
        console.error('⚠️ Redis initialization failed:', redisError.message)
        console.log('⚠️ Continuing without Redis cache...')
      }
    } else {
      console.log('ℹ️ Redis is disabled (set REDIS_ENABLED=true to enable)')
    }
    
    // Initialize Kafka (if enabled)
    if (process.env.KAFKA_ENABLED === 'true') {
      try {
        console.log('🔄 Initializing Kafka...')
        
        // Create topics
        await createTopics()
        
        // Connect producer
        await kafkaProducer.connect()
        
        // Connect consumer
        await kafkaConsumer.connect()
        await kafkaConsumer.subscribe()
        
        // Start consuming messages
        await kafkaConsumer.start()
        
        console.log('✅ Kafka initialized successfully')
      } catch (kafkaError) {
        console.error('⚠️ Kafka initialization failed:', kafkaError.message)
        console.log('⚠️ Continuing without Kafka...')
      }
    } else {
      console.log('ℹ️ Kafka is disabled (set KAFKA_ENABLED=true to enable)')
    }
    
    // Initialize WebSocket service
    const wss = websocketService.initialize(server)
    app.locals.wss = wss
    
    // Set WebSocket server reference for Kafka consumer
    if (process.env.KAFKA_ENABLED === 'true') {
      kafkaConsumer.setWebSocketServer(wss)
    }
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 WebSocket available at ws://localhost:${PORT}/transactions`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
    })
    
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  websocketService.close()
  
  // Disconnect Redis
  if (process.env.REDIS_ENABLED !== 'false') {
    await redisClient.disconnect()
  }
  
  // Disconnect Kafka
  if (process.env.KAFKA_ENABLED === 'true') {
    kafkaProducer.disconnect()
    kafkaConsumer.disconnect()
  }
  
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  websocketService.close()
  
  // Disconnect Redis
  if (process.env.REDIS_ENABLED !== 'false') {
    await redisClient.disconnect()
  }
  
  // Disconnect Kafka
  if (process.env.KAFKA_ENABLED === 'true') {
    kafkaProducer.disconnect()
    kafkaConsumer.disconnect()
  }
  
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

// Start the server
startServer()