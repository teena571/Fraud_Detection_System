import responseTime from 'response-time'

/**
 * Response time logger middleware
 * Tracks and logs API response times for monitoring
 */

// Store response time statistics
const stats = {
  requests: 0,
  totalTime: 0,
  avgTime: 0,
  minTime: Infinity,
  maxTime: 0,
  slowRequests: 0, // Requests > 1000ms
  byEndpoint: new Map()
}

/**
 * Response time middleware with statistics tracking
 */
export const responseTimeLogger = responseTime((req, res, time) => {
  // Update global statistics
  stats.requests++
  stats.totalTime += time
  stats.avgTime = stats.totalTime / stats.requests
  stats.minTime = Math.min(stats.minTime, time)
  stats.maxTime = Math.max(stats.maxTime, time)
  
  if (time > 1000) {
    stats.slowRequests++
  }

  // Track by endpoint
  const endpoint = `${req.method} ${req.route?.path || req.path}`
  if (!stats.byEndpoint.has(endpoint)) {
    stats.byEndpoint.set(endpoint, {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0
    })
  }
  
  const endpointStats = stats.byEndpoint.get(endpoint)
  endpointStats.count++
  endpointStats.totalTime += time
  endpointStats.avgTime = endpointStats.totalTime / endpointStats.count
  endpointStats.minTime = Math.min(endpointStats.minTime, time)
  endpointStats.maxTime = Math.max(endpointStats.maxTime, time)

  // Log slow requests (> 1000ms)
  if (time > 1000) {
    console.warn(`⚠️ SLOW REQUEST: ${req.method} ${req.originalUrl} - ${time.toFixed(2)}ms`)
  }

  // Log very slow requests (> 3000ms)
  if (time > 3000) {
    console.error(`❌ VERY SLOW REQUEST: ${req.method} ${req.originalUrl} - ${time.toFixed(2)}ms`)
  }

  // Add response time header
  res.setHeader('X-Response-Time', `${time.toFixed(2)}ms`)

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    const color = time < 100 ? '🟢' : time < 500 ? '🟡' : time < 1000 ? '🟠' : '🔴'
    console.log(`${color} ${req.method} ${req.originalUrl} - ${time.toFixed(2)}ms`)
  }
})

/**
 * Get response time statistics
 */
export const getStats = () => {
  const endpointStats = Array.from(stats.byEndpoint.entries()).map(([endpoint, data]) => ({
    endpoint,
    ...data,
    avgTime: parseFloat(data.avgTime.toFixed(2)),
    minTime: parseFloat(data.minTime.toFixed(2)),
    maxTime: parseFloat(data.maxTime.toFixed(2))
  }))

  // Sort by average time (slowest first)
  endpointStats.sort((a, b) => b.avgTime - a.avgTime)

  return {
    global: {
      totalRequests: stats.requests,
      avgResponseTime: parseFloat(stats.avgTime.toFixed(2)),
      minResponseTime: parseFloat(stats.minTime.toFixed(2)),
      maxResponseTime: parseFloat(stats.maxTime.toFixed(2)),
      slowRequests: stats.slowRequests,
      slowRequestPercentage: parseFloat(((stats.slowRequests / stats.requests) * 100).toFixed(2))
    },
    endpoints: endpointStats.slice(0, 20) // Top 20 endpoints
  }
}

/**
 * Reset statistics
 */
export const resetStats = () => {
  stats.requests = 0
  stats.totalTime = 0
  stats.avgTime = 0
  stats.minTime = Infinity
  stats.maxTime = 0
  stats.slowRequests = 0
  stats.byEndpoint.clear()
}

/**
 * Middleware to expose stats endpoint
 */
export const statsEndpoint = (req, res) => {
  const statistics = getStats()
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stats: statistics
  })
}

export default {
  responseTimeLogger,
  getStats,
  resetStats,
  statsEndpoint
}
