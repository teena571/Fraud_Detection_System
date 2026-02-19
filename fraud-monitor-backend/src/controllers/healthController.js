import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import database from '../config/database.js'
import redisClient from '../config/redis.js'
import kafkaProducer from '../kafka/producer.js'
import kafkaConsumer from '../kafka/consumer.js'
import websocketService from '../sockets/websocket.js'
import logger from '../config/logger.js'
import os from 'os'

/**
 * Basic health check
 * GET /api/health
 */
export const healthCheck = asyncHandler(async (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    node_version: process.version
  }

  res.json(new ApiResponse(200, healthData, 'Service is healthy'))
})

/**
 * Detailed health check with dependencies
 * GET /api/health/detailed
 */
export const detailedHealthCheck = asyncHandler(async (req, res) => {
  const startTime = Date.now()
  
  // Check all services
  const [
    databaseHealth,
    redisHealth,
    kafkaProducerHealth,
    kafkaConsumerHealth
  ] = await Promise.allSettled([
    database.healthCheck(),
    redisClient.healthCheck(),
    kafkaProducer.healthCheck(),
    kafkaConsumer.healthCheck()
  ])

  // System information
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024),
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg()
    },
    uptime: {
      system: os.uptime(),
      process: process.uptime()
    }
  }

  // Service status
  const services = {
    database: {
      status: databaseHealth.status === 'fulfilled' ? databaseHealth.value.status : 'unhealthy',
      details: databaseHealth.status === 'fulfilled' ? databaseHealth.value : { error: databaseHealth.reason?.message }
    },
    redis: {
      status: redisHealth.status === 'fulfilled' ? redisHealth.value.status : 'unhealthy',
      details: redisHealth.status === 'fulfilled' ? redisHealth.value : { error: redisHealth.reason?.message }
    },
    kafka: {
      producer: {
        status: kafkaProducerHealth.status === 'fulfilled' ? kafkaProducerHealth.value.status : 'unhealthy',
        details: kafkaProducerHealth.status === 'fulfilled' ? kafkaProducerHealth.value : { error: kafkaProducerHealth.reason?.message }
      },
      consumer: {
        status: kafkaConsumerHealth.status === 'fulfilled' ? kafkaConsumerHealth.value.status : 'unhealthy',
        details: kafkaConsumerHealth.status === 'fulfilled' ? kafkaConsumerHealth.value : { error: kafkaConsumerHealth.reason?.message }
      }
    },
    websocket: {
      status: websocketService.wss ? 'healthy' : 'disabled',
      stats: websocketService.wss ? websocketService.getStats() : null
    }
  }

  // Overall health status
  const unhealthyServices = Object.values(services).filter(service => {
    if (service.status) {
      return service.status === 'unhealthy'
    }
    // For nested services like Kafka
    return Object.values(service).some(subService => subService.status === 'unhealthy')
  })

  const overallStatus = unhealthyServices.length === 0 ? 'healthy' : 'degraded'
  const responseTime = Date.now() - startTime

  const healthData = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    system: systemInfo,
    services
  }

  const statusCode = overallStatus === 'healthy' ? 200 : 503
  res.status(statusCode).json(new ApiResponse(statusCode, healthData, `Service is ${overallStatus}`))
})

/**
 * Readiness check (for Kubernetes)
 * GET /api/health/ready
 */
export const readinessCheck = asyncHandler(async (req, res) => {
  // Check critical services that must be available
  const databaseHealth = await database.healthCheck()
  
  if (databaseHealth.status !== 'healthy') {
    return res.status(503).json(new ApiResponse(503, {
      status: 'not ready',
      reason: 'Database not available'
    }, 'Service not ready'))
  }

  res.json(new ApiResponse(200, {
    status: 'ready',
    timestamp: new Date().toISOString()
  }, 'Service is ready'))
})

/**
 * Liveness check (for Kubernetes)
 * GET /api/health/live
 */
export const livenessCheck = asyncHandler(async (req, res) => {
  // Simple check to ensure the application is running
  res.json(new ApiResponse(200, {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }, 'Service is alive'))
})

/**
 * Get service metrics
 * GET /api/health/metrics
 */
export const getMetrics = asyncHandler(async (req, res) => {
  const memoryUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()
  
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024) // MB
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    system: {
      loadAverage: os.loadavg(),
      freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
      totalMemory: Math.round(os.totalmem() / 1024 / 1024) // MB
    },
    websocket: websocketService.wss ? websocketService.getStats() : null
  }

  res.json(new ApiResponse(200, metrics, 'Metrics retrieved successfully'))
})

/**
 * Get application info
 * GET /api/health/info
 */
export const getInfo = asyncHandler(async (req, res) => {
  const info = {
    name: 'fraud-monitor-backend',
    version: process.env.npm_package_version || '1.0.0',
    description: 'Production-ready backend for fraud monitoring system',
    environment: process.env.NODE_ENV,
    node_version: process.version,
    platform: os.platform(),
    architecture: os.arch(),
    started_at: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    uptime: process.uptime(),
    features: {
      websocket: process.env.WS_ENABLED === 'true',
      redis: redisClient.isConnected,
      kafka: kafkaProducer.isConnected || kafkaConsumer.isConnected
    }
  }

  res.json(new ApiResponse(200, info, 'Application info retrieved successfully'))
})