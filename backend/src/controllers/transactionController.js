import Transaction from '../models/Transaction.js'
import Alert from '../models/Alert.js'
import { validationResult } from 'express-validator'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { generateTransactionId } from '../utils/helpers.js'

/**
 * Get all transactions with pagination and filters
 * GET /api/transactions
 */
export const getTransactions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    userId,
    minAmount,
    maxAmount,
    minRiskScore,
    maxRiskScore,
    startDate,
    endDate,
    sortBy = 'timestamp',
    sortOrder = 'desc',
    search
  } = req.query

  // Build filter object
  const filter = {}

  if (status) {
    if (Array.isArray(status)) {
      filter.status = { $in: status }
    } else {
      filter.status = status
    }
  }

  if (userId) {
    filter.userId = userId
  }

  // Amount range filter
  if (minAmount || maxAmount) {
    filter.amount = {}
    if (minAmount) filter.amount.$gte = parseFloat(minAmount)
    if (maxAmount) filter.amount.$lte = parseFloat(maxAmount)
  }

  // Risk score range filter
  if (minRiskScore || maxRiskScore) {
    filter.riskScore = {}
    if (minRiskScore) filter.riskScore.$gte = parseFloat(minRiskScore)
    if (maxRiskScore) filter.riskScore.$lte = parseFloat(maxRiskScore)
  }

  // Date range filter
  if (startDate || endDate) {
    filter.timestamp = {}
    if (startDate) filter.timestamp.$gte = new Date(startDate)
    if (endDate) filter.timestamp.$lte = new Date(endDate)
  }

  // Search filter (searches in transactionId, userId, description)
  if (search) {
    filter.$or = [
      { transactionId: { $regex: search, $options: 'i' } },
      { userId: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ]
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))) // Max 100 items per page
  const skip = (pageNum - 1) * limitNum

  // Sort options
  const sortOptions = {}
  const validSortFields = ['timestamp', 'amount', 'riskScore', 'status', 'createdAt']
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'timestamp'
  const sortDirection = sortOrder === 'asc' ? 1 : -1
  sortOptions[sortField] = sortDirection

  try {
    // Execute query with pagination
    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(filter)
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
    const stats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          avgRiskScore: { $avg: '$riskScore' },
          safeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'SAFE'] }, 1, 0] }
          },
          suspiciousCount: {
            $sum: { $cond: [{ $eq: ['$status', 'SUSPICIOUS'] }, 1, 0] }
          },
          fraudCount: {
            $sum: { $cond: [{ $eq: ['$status', 'FRAUD'] }, 1, 0] }
          }
        }
      }
    ])

    const summary = stats[0] || {
      totalAmount: 0,
      avgAmount: 0,
      avgRiskScore: 0,
      safeCount: 0,
      suspiciousCount: 0,
      fraudCount: 0
    }

    res.json(new ApiResponse(200, {
      transactions,
      pagination,
      summary,
      filters: {
        status,
        userId,
        minAmount,
        maxAmount,
        minRiskScore,
        maxRiskScore,
        startDate,
        endDate,
        search
      }
    }, 'Transactions retrieved successfully'))

  } catch (error) {
    throw new ApiError(500, 'Failed to retrieve transactions', error)
  }
})

/**
 * Get single transaction by ID
 * GET /api/transactions/:id
 */
export const getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const transaction = await Transaction.findOne({
    $or: [
      { _id: id },
      { transactionId: id }
    ]
  })

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found')
  }

  res.json(new ApiResponse(200, transaction, 'Transaction retrieved successfully'))
})

/**
 * Create new transaction
 * POST /api/transactions
 */
export const createTransaction = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array())
  }

  const {
    userId,
    amount,
    timestamp,
    status,
    riskScore,
    description,
    merchantId,
    paymentMethod,
    location,
    metadata
  } = req.body

  // Generate unique transaction ID if not provided
  const transactionId = req.body.transactionId || generateTransactionId()

  // Check if transaction ID already exists
  const existingTransaction = await Transaction.findOne({ transactionId })
  if (existingTransaction) {
    throw new ApiError(409, 'Transaction ID already exists')
  }

  try {
    const transaction = new Transaction({
      transactionId,
      userId,
      amount,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      status: status || 'SAFE',
      riskScore: riskScore || 0,
      description,
      merchantId,
      paymentMethod,
      location,
      metadata,
      createdBy: req.user?.id || 'system'
    })

    const savedTransaction = await transaction.save()

    // Automatically create alert if conditions are met
    // Logic: If riskScore > 70 OR amount > 50000 → create alert
    try {
      const alerts = await Alert.createFromTransaction(savedTransaction.toObject())
      
      // Emit alert events via WebSocket
      if (alerts.length > 0 && req.app.locals.wss) {
        alerts.forEach(alert => {
          req.app.locals.wss.clients.forEach(client => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'alert_created',
                payload: alert
              }))
            }
          })
        })
      }
    } catch (alertError) {
      // Log error but don't fail transaction creation
      console.error('Failed to create alert:', alertError)
    }

    // Emit real-time event (if WebSocket is connected)
    if (req.app.locals.wss) {
      req.app.locals.wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            type: 'transaction',
            payload: savedTransaction.toSafeObject()
          }))
        }
      })
    }

    res.status(201).json(new ApiResponse(201, savedTransaction, 'Transaction created successfully'))

  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'Transaction ID already exists')
    }
    throw new ApiError(500, 'Failed to create transaction', error)
  }
})

/**
 * Update transaction
 * PUT /api/transactions/:id
 */
export const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  // Check for validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array())
  }

  const transaction = await Transaction.findOne({
    $or: [
      { _id: id },
      { transactionId: id }
    ]
  })

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found')
  }

  // Update allowed fields
  const allowedUpdates = [
    'status', 'riskScore', 'description', 'merchantId', 
    'paymentMethod', 'location', 'metadata'
  ]
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      transaction[field] = req.body[field]
    }
  })

  transaction.updatedBy = req.user?.id || 'system'

  try {
    const updatedTransaction = await transaction.save()

    // Emit real-time event
    if (req.app.locals.wss) {
      req.app.locals.wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'transaction_update',
            payload: updatedTransaction.toSafeObject()
          }))
        }
      })
    }

    res.json(new ApiResponse(200, updatedTransaction, 'Transaction updated successfully'))

  } catch (error) {
    throw new ApiError(500, 'Failed to update transaction', error)
  }
})

/**
 * Delete transaction
 * DELETE /api/transactions/:id
 */
export const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params

  const transaction = await Transaction.findOneAndDelete({
    $or: [
      { _id: id },
      { transactionId: id }
    ]
  })

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found')
  }

  // Emit real-time event
  if (req.app.locals.wss) {
    req.app.locals.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'transaction_delete',
          payload: { id: transaction.transactionId }
        }))
      }
    })
  }

  res.json(new ApiResponse(200, null, 'Transaction deleted successfully'))
})

/**
 * Get transaction statistics
 * GET /api/transactions/stats
 */
export const getTransactionStats = asyncHandler(async (req, res) => {
  const { timeframe = '24h' } = req.query

  // Calculate date range based on timeframe
  const now = new Date()
  let startDate
  
  switch (timeframe) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }

  const [statusCounts, riskDistribution, recentTrends] = await Promise.all([
    // Status counts
    Transaction.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgRiskScore: { $avg: '$riskScore' }
        }
      }
    ]),

    // Risk score distribution
    Transaction.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $bucket: {
          groupBy: '$riskScore',
          boundaries: [0, 25, 50, 75, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        }
      }
    ]),

    // Hourly trends
    Transaction.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 },
          fraudCount: {
            $sum: { $cond: [{ $eq: ['$status', 'FRAUD'] }, 1, 0] }
          },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.date': 1, '_id.hour': 1 } }
    ])
  ])

  res.json(new ApiResponse(200, {
    timeframe,
    statusCounts,
    riskDistribution,
    recentTrends
  }, 'Transaction statistics retrieved successfully'))
})