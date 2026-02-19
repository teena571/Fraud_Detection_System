import express from 'express'
import { body, param, query } from 'express-validator'
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats
} from '../controllers/transactionController.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validation.js'
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js'

const router = express.Router()

// Validation schemas
const createTransactionValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('User ID must be between 1 and 100 characters'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => {
      if (value < 0) {
        throw new Error('Amount must be positive')
      }
      if (value > 1000000) {
        throw new Error('Amount cannot exceed 1,000,000')
      }
      return true
    }),

  body('transactionId')
    .optional()
    .isString()
    .withMessage('Transaction ID must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Transaction ID must be between 1 and 100 characters'),

  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO 8601 date'),

  body('status')
    .optional()
    .isIn(['SAFE', 'SUSPICIOUS', 'FRAUD'])
    .withMessage('Status must be one of: SAFE, SUSPICIOUS, FRAUD'),

  body('riskScore')
    .optional()
    .isNumeric()
    .withMessage('Risk score must be a number')
    .custom(value => {
      if (value < 0 || value > 100) {
        throw new Error('Risk score must be between 0 and 100')
      }
      return true
    }),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('merchantId')
    .optional()
    .isString()
    .withMessage('Merchant ID must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Merchant ID cannot exceed 100 characters'),

  body('paymentMethod')
    .optional()
    .isIn(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'OTHER'])
    .withMessage('Invalid payment method'),

  body('location.country')
    .optional()
    .isString()
    .withMessage('Country must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),

  body('location.city')
    .optional()
    .isString()
    .withMessage('City must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),

  body('location.ipAddress')
    .optional()
    .isIP()
    .withMessage('Invalid IP address format')
]

const updateTransactionValidation = [
  param('id')
    .notEmpty()
    .withMessage('Transaction ID is required'),

  body('status')
    .optional()
    .isIn(['SAFE', 'SUSPICIOUS', 'FRAUD'])
    .withMessage('Status must be one of: SAFE, SUSPICIOUS, FRAUD'),

  body('riskScore')
    .optional()
    .isNumeric()
    .withMessage('Risk score must be a number')
    .custom(value => {
      if (value < 0 || value > 100) {
        throw new Error('Risk score must be between 0 and 100')
      }
      return true
    }),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('merchantId')
    .optional()
    .isString()
    .withMessage('Merchant ID must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Merchant ID cannot exceed 100 characters'),

  body('paymentMethod')
    .optional()
    .isIn(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'OTHER'])
    .withMessage('Invalid payment method')
]

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .custom(value => {
      const validStatuses = ['SAFE', 'SUSPICIOUS', 'FRAUD']
      if (Array.isArray(value)) {
        return value.every(status => validStatuses.includes(status))
      }
      return validStatuses.includes(value)
    })
    .withMessage('Invalid status value'),

  query('minAmount')
    .optional()
    .isNumeric()
    .withMessage('Min amount must be a number'),

  query('maxAmount')
    .optional()
    .isNumeric()
    .withMessage('Max amount must be a number'),

  query('minRiskScore')
    .optional()
    .isNumeric()
    .withMessage('Min risk score must be a number')
    .custom(value => value >= 0 && value <= 100)
    .withMessage('Min risk score must be between 0 and 100'),

  query('maxRiskScore')
    .optional()
    .isNumeric()
    .withMessage('Max risk score must be a number')
    .custom(value => value >= 0 && value <= 100)
    .withMessage('Max risk score must be between 0 and 100'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),

  query('sortBy')
    .optional()
    .isIn(['timestamp', 'amount', 'riskScore', 'status', 'createdAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters')
]

// Routes

/**
 * @route   GET /api/transactions/stats
 * @desc    Get transaction statistics
 * @access  Private (Admin)
 */
router.get('/stats', 
  authenticate, 
  authorize(['admin']),
  query('timeframe').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
  validateRequest,
  cacheMiddleware({ ttl: 60, keyPrefix: 'transaction-stats', includeQuery: true }),
  getTransactionStats
)

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions with pagination and filters
 * @access  Private
 */
router.get('/', 
  authenticate,
  queryValidation,
  validateRequest,
  cacheMiddleware({ ttl: 60, keyPrefix: 'transactions', includeQuery: true }),
  getTransactions
)

/**
 * @route   GET /api/transactions/:id
 * @desc    Get single transaction by ID
 * @access  Private
 */
router.get('/:id', 
  authenticate,
  param('id').notEmpty().withMessage('Transaction ID is required'),
  validateRequest,
  cacheMiddleware({ ttl: 60, keyPrefix: 'transaction', includeQuery: false }),
  getTransactionById
)

/**
 * @route   POST /api/transactions
 * @desc    Create new transaction
 * @access  Private (Admin)
 */
router.post('/', 
  authenticate,
  authorize(['admin', 'system']),
  createTransactionValidation,
  validateRequest,
  invalidateCache(['transactions:*', 'transaction-stats:*']),
  createTransaction
)

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Private (Admin)
 */
router.put('/:id', 
  authenticate,
  authorize(['admin']),
  updateTransactionValidation,
  validateRequest,
  invalidateCache(['transactions:*', 'transaction:*', 'transaction-stats:*']),
  updateTransaction
)

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private (Admin)
 */
router.delete('/:id', 
  authenticate,
  authorize(['admin']),
  param('id').notEmpty().withMessage('Transaction ID is required'),
  validateRequest,
  invalidateCache(['transactions:*', 'transaction:*', 'transaction-stats:*']),
  deleteTransaction
)

export default router