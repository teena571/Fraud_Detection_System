import Alert from '../models/Alert.js'
import { validationResult } from 'express-validator'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * Get all alerts with pagination and filters
 * GET /api/alerts
 */
export const getAlerts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    severity,
    status,
    transactionId,
    userId,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  // Build filter object
  const filter = {}

  if (severity) {
    if (Array.isArray(severity)) {
      filter.severity = { $in: severity }
    } else {
      filter.severity = severity
    }
  }

  if (status) {
    if (Array.isArray(status)) {
      filter.status = { $in: status }
    } else {
      filter.status = status
    }
  }

  if (transactionId) {
    filter.transactionId = transactionId
  }

  if (userId) {
    filter.userId = userId
  }

  // Date range filter
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate) filter.createdAt.$lte = new Date(endDate)
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  // Sort options
  const sortOptions = {}
  const validSortFields = ['createdAt', 'severity', 'status', 'transactionAmount', 'transactionRiskScore']
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
  
  // Custom sort for severity (CRITICAL > HIGH > MEDIUM > LOW)
  if (sortField === 'severity') {
    const severityOrder = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 }
    const sortDirection = sortOrder === 'asc' ? 1 : -1
    
    const alerts = await Alert.find(filter)
      .skip(skip)
      .limit(limitNum)
      .lean()
    
    alerts.sort((a, b) => {
      const orderA = severityOrder[a.severity] || 5
      const orderB = severityOrder[b.severity] || 5
      return sortDirection * (orderA - orderB)
    })
    
    const totalCount = await Alert.countDocuments(filter)
    const totalPages = Math.ceil(totalCount / limitNum)
    
    return res.json(new ApiResponse(200, {
      alerts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        nextPage: pageNum < totalPages ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null
      }
    }, 'Alerts retrieved successfully'))
  }
  
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  sortOptions[sortField] = sortDirection

  try {
    // Execute query with pagination
    const [alerts, totalCount] = await Promise.all([
      Alert.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Alert.countDocuments(filter)
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum)
    const hasNextPage = pageNum < totalPages
    const hasPrevPage = pageNum > 1

    const pagination = {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? pageNum + 1 : null,
      prevPage: hasPrevPage ? pageNum - 1 : null
    }

    // Get summary statistics
    const stats = await Alert.getAlertStats()

    res.json(new ApiResponse(200, {
      alerts,
      pagination,
      stats,
      filters: {
        severity,
        status,
        transactionId,
        userId,
        startDate,
        endDate
      }
    }, 'Alerts retrieved successfully'))

  } catch (error) {
    throw new ApiError(500, 'Failed to retrieve alerts', error)
  }
})

/**
 * Get single alert by ID
 * GET /api/alerts/:id
 */
export const getAlertById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const alert = await Alert.findById(id)

  if (!alert) {
    throw new ApiError(404, 'Alert not found')
  }

  res.json(new ApiResponse(200, alert, 'Alert retrieved successfully'))
})

/**
 * Delete alert
 * DELETE /api/alerts/:id
 */
export const deleteAlert = asyncHandler(async (req, res) => {
  const { id } = req.params

  const alert = await Alert.findByIdAndDelete(id)

  if (!alert) {
    throw new ApiError(404, 'Alert not found')
  }

  // Emit real-time event
  if (req.app.locals.wss) {
    req.app.locals.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'alert_deleted',
          payload: { id: alert.id }
        }))
      }
    })
  }

  res.json(new ApiResponse(200, null, 'Alert deleted successfully'))
})

/**
 * Get active alerts
 * GET /api/alerts/active
 */
export const getActiveAlerts = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query

  const alerts = await Alert.getActiveAlerts(parseInt(limit))

  res.json(new ApiResponse(200, alerts, 'Active alerts retrieved successfully'))
})

/**
 * Get critical alerts
 * GET /api/alerts/critical
 */
export const getCriticalAlerts = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query

  const alerts = await Alert.getCriticalAlerts(parseInt(limit))

  res.json(new ApiResponse(200, alerts, 'Critical alerts retrieved successfully'))
})

/**
 * Get alerts by transaction ID
 * GET /api/alerts/transaction/:transactionId
 */
export const getAlertsByTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params

  const alerts = await Alert.getAlertsByTransaction(transactionId)

  res.json(new ApiResponse(200, alerts, 'Transaction alerts retrieved successfully'))
})

/**
 * Get alert statistics
 * GET /api/alerts/stats
 */
export const getAlertStats = asyncHandler(async (req, res) => {
  const stats = await Alert.getAlertStats()

  res.json(new ApiResponse(200, stats, 'Alert statistics retrieved successfully'))
})

/**
 * Acknowledge alert
 * POST /api/alerts/:id/acknowledge
 */
export const acknowledgeAlert = asyncHandler(async (req, res) => {
  const { id } = req.params

  const alert = await Alert.findById(id)

  if (!alert) {
    throw new ApiError(404, 'Alert not found')
  }

  await alert.acknowledge(req.user?.id || 'system')

  // Emit real-time event
  if (req.app.locals.wss) {
    req.app.locals.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'alert_acknowledged',
          payload: alert.toObject()
        }))
      }
    })
  }

  res.json(new ApiResponse(200, alert, 'Alert acknowledged successfully'))
})

/**
 * Resolve alert
 * POST /api/alerts/:id/resolve
 */
export const resolveAlert = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { notes } = req.body

  const alert = await Alert.findById(id)

  if (!alert) {
    throw new ApiError(404, 'Alert not found')
  }

  await alert.resolve(req.user?.id || 'system', notes)

  // Emit real-time event
  if (req.app.locals.wss) {
    req.app.locals.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'alert_resolved',
          payload: alert.toObject()
        }))
      }
    })
  }

  res.json(new ApiResponse(200, alert, 'Alert resolved successfully'))
})

/**
 * Dismiss alert
 * POST /api/alerts/:id/dismiss
 */
export const dismissAlert = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { notes } = req.body

  const alert = await Alert.findById(id)

  if (!alert) {
    throw new ApiError(404, 'Alert not found')
  }

  await alert.dismiss(req.user?.id || 'system', notes)

  // Emit real-time event
  if (req.app.locals.wss) {
    req.app.locals.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'alert_dismissed',
          payload: alert.toObject()
        }))
      }
    })
  }

  res.json(new ApiResponse(200, alert, 'Alert dismissed successfully'))
})