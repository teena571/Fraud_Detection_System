import Transaction from '../models/Transaction.js'
import Rule from '../models/Rule.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import kafkaProducer from '../kafka/producer.js'
import websocketService from '../sockets/websocket.js'
import logger from '../config/logger.js'

/**
 * Get all transactions with filtering and pagination
 * GET /api/transactions
 */
export const getTransactions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    minRiskScore,
    maxRiskScore,
    userId,
    merchantId,
    startDate,
    endDate,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  // Build query
  const query = {}
  
  if (status) {
    query.status = status
  }
  
  if (minRiskScore) {
    query.riskScore = { ...query.riskScore, $gte: Number(minRiskScore) }
  }
  
  if (maxRiskScore) {
    query.riskScore = { ...query.riskScore, $lte: Number(maxRiskScore) }
  }
  
  if (userId) {
    query.userId = userId
  }
  
  if (merchantId) {
    query.merchantId = merchantId
  }
  
  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) query.createdAt.$lte = new Date(endDate)
  }
  
  if (search) {
    query.$or = [
      { transactionId: { $regex: search, $options: 'i' } },
      { userId: { $regex: search, $options: 'i' } },
      { merchantName: { $regex: search, $options: 'i' } }
    ]
  }

  // Execute query with pagination
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
  }

  const transactions = await Transaction.find(query)
    .sort(options.sort)
    .limit(options.limit * 1)
    .skip((options.page - 1) * options.limit)
    .exec()

  const total = await Transaction.countDocuments(query)

  const result = {
    transactions,
    pagination: {
      currentPage: options.page,
      totalPages: Math.ceil(total / options.limit),
      totalItems: total,
      itemsPerPage: options.limit,
      hasNext: options.page < Math.ceil(total / options.limit),
      hasPrev: options.page > 1
    }
  }

  res.json(new ApiResponse(200, result, 'Transactions retrieved successfully'))
})

/**
 * Get transaction by ID
 * GET /api/transactions/:id
 */
export const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
  
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
  const transactionData = req.body

  // Generate transaction ID if not provided
  if (!transactionData.transactionId) {
    transactionData.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Create transaction
  const transaction = new Transaction(transactionData)
  
  // Evaluate rules
  const ruleResults = await Rule.evaluateTransaction(transaction.toObject())
  
  // Apply rule actions
  for (const result of ruleResults) {
    for (const action of result.actions) {
      switch (action.type) {
        case 'flag':
          transaction.addFlag(
            action.parameters?.get('type') || 'RULE_VIOLATION',
            action.parameters?.get('reason') || `Rule: ${result.ruleName}`,
            action.parameters?.get('severity') || 'MEDIUM'
          )
          break
        case 'score_adjustment':
          const adjustment = Number(action.parameters?.get('adjustment') || 0)
          transaction.riskScore = Math.max(0, Math.min(100, transaction.riskScore + adjustment))
          break
        case 'block':
          transaction.status = 'FRAUD'
          break
        case 'review':
          transaction.status = 'SUSPICIOUS'
          break
      }
    }
  }

  await transaction.save()

  // Send to Kafka
  if (kafkaProducer.isConnected) {
    await kafkaProducer.sendTransactionEvent(transaction.toObject(), 'created')
  }

  // Broadcast to WebSocket clients
  if (websocketService.wss) {
    websocketService.broadcast({
      type: 'transaction_created',
      data: transaction.toObject(),
      timestamp: new Date().toISOString()
    }, 'transactions')
  }

  logger.info(`Transaction created: ${transaction.transactionId}`)

  res.status(201).json(new ApiResponse(201, transaction, 'Transaction created successfully'))
})

/**
 * Update transaction
 * PUT /api/transactions/:id
 */
export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
  
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found')
  }

  // Update fields
  Object.assign(transaction, req.body)
  await transaction.save()

  // Send to Kafka
  if (kafkaProducer.isConnected) {
    await kafkaProducer.sendTransactionEvent(transaction.toObject(), 'updated')
  }

  // Broadcast to WebSocket clients
  if (websocketService.wss) {
    websocketService.broadcast({
      type: 'transaction_updated',
      data: transaction.toObject(),
      timestamp: new Date().toISOString()
    }, 'transactions')
  }

  res.json(new ApiResponse(200, transaction, 'Transaction updated successfully'))
})

/**
 * Delete transaction
 * DELETE /api/transactions/:id
 */
export const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
  
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found')
  }

  await Transaction.findByIdAndDelete(req.params.id)

  // Send to Kafka
  if (kafkaProducer.isConnected) {
    await kafkaProducer.sendTransactionEvent(transaction.toObject(), 'deleted')
  }

  res.json(new ApiResponse(200, null, 'Transaction deleted successfully'))
})

/**
 * Get high-risk transactions
 * GET /api/transactions/high-risk
 */
export const getHighRiskTransactions = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query
  
  const transactions = await Transaction.findHighRisk(parseInt(limit))
  
  res.json(new ApiResponse(200, transactions, 'High-risk transactions retrieved successfully'))
})

/**
 * Get transaction statistics
 * GET /api/transactions/statistics
 */
export const getTransactionStatistics = asyncHandler(async (req, res) => {
  const stats = await Transaction.getStatistics()
  
  res.json(new ApiResponse(200, stats, 'Transaction statistics retrieved successfully'))
})

/**
 * Mark transaction as fraud
 * POST /api/transactions/:id/mark-fraud
 */
export const markAsFraud = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
  
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found')
  }

  const { notes } = req.body
  await transaction.markAsFraud(req.user.id, notes)

  // Send alert to Kafka
  if (kafkaProducer.isConnected) {
    await kafkaProducer.sendAlertEvent({
      id: `alert_${Date.now()}`,
      type: 'FRAUD_CONFIRMED',
      transactionId: transaction.transactionId,
      severity: 'HIGH',
      message: `Transaction ${transaction.transactionId} marked as fraud`,
      reviewedBy: req.user.id
    })
  }

  // Broadcast to WebSocket clients
  if (websocketService.wss) {
    websocketService.broadcast({
      type: 'transaction_fraud',
      data: transaction.toObject(),
      timestamp: new Date().toISOString()
    }, 'alerts')
  }

  res.json(new ApiResponse(200, transaction, 'Transaction marked as fraud'))
})

/**
 * Mark transaction as safe
 * POST /api/transactions/:id/mark-safe
 */
export const markAsSafe = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
  
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found')
  }

  const { notes } = req.body
  await transaction.markAsSafe(req.user.id, notes)

  // Broadcast to WebSocket clients
  if (websocketService.wss) {
    websocketService.broadcast({
      type: 'transaction_safe',
      data: transaction.toObject(),
      timestamp: new Date().toISOString()
    }, 'transactions')
  }

  res.json(new ApiResponse(200, transaction, 'Transaction marked as safe'))
})