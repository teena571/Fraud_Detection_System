import mongoose from 'mongoose'
import redisClient from '../config/redis.js'
import { checkKafkaHealth } from '../config/kafka.js'
import websocketService from '../services/websocketService.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * Get system health status
 * GET /api/admin/health
 */
export const getSystemHealth = asyncHandler(async (req, res) => {
  const startTime = Date.now()

  // Check MongoDB status
  const mongoStatus = {
    status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
    connected: mongoose.connection.readyState === 1,
    host: mongoose.connection.host || 'unknown',
    database: mongoose.connection.name || 'unknown',
    readyState: getMongoReadyState(mongoose.connection.readyState)
  }

  // Check Redis status
  let redisStatus = {
    status: 'disabled',
    connected: false,
    enabled: process.env.REDIS_ENABLED !== 'false'
  }

  if (process.env.REDIS_ENABLED !== 'false') {
    const redisHealth = await redisClient.healthCheck()
    redisStatus = {
      status: redisHealth.status,
      connected: redisHealth.connected || false,
      latency: redisHealth.latency || 'N/A',
      usedMemory: redisHealth.usedMemory || 'N/A',
      enabled: true
    }
  }

  // Check Kafka status
  let kafkaStatus = {
    status: 'disabled',
    connected: false,
    enabled: process.env.KAFKA_ENABLED === 'true'
  }

  if (process.env.KAFKA_ENABLED === 'true') {
    try {
      const kafkaHealth = await checkKafkaHealth()
      kafkaStatus = {
        status: kafkaHealth.status,
        connected: kafkaHealth.status === 'healthy',
        brokers: kafkaHealth.brokers || 0,
        controller: kafkaHealth.controller || 'N/A',
        enabled: true
      }
    } catch (error) {
      kafkaStatus = {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        enabled: true
      }
    }
  }

  // Check WebSocket status
  const wsStatus = {
    status: websocketService.isInitialized() ? 'healthy' : 'unhealthy',
    connected: websocketService.isInitialized(),
    activeConnections: websocketService.getConnectionCount()
  }

  // Backend status
  const backendStatus = {
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    uptimeFormatted: formatUptime(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
      unit: 'MB'
    },
    cpu: {
      usage: process.cpuUsage(),
      loadAverage: process.platform !== 'win32' ? process.loadavg() : [0, 0, 0]
    },
    version: process.version,
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 4000
  }

  // Overall system status
  const allHealthy = 
    mongoStatus.status === 'healthy' &&
    (redisStatus.status === 'healthy' || redisStatus.status === 'disabled') &&
    (kafkaStatus.status === 'healthy' || kafkaStatus.status === 'disabled') &&
    wsStatus.status === 'healthy' &&
    backendStatus.status === 'healthy'

  const responseTime = Date.now() - startTime

  res.json(new ApiResponse(200, {
    overall: {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`
    },
    services: {
      backend: backendStatus,
      mongodb: mongoStatus,
      redis: redisStatus,
      kafka: kafkaStatus,
      websocket: wsStatus
    }
  }, 'System health retrieved successfully'))
})

/**
 * Helper function to get MongoDB ready state description
 */
function getMongoReadyState(state) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }
  return states[state] || 'unknown'
}

/**
 * Helper function to format uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}

export default {
  getSystemHealth
}
