import express from 'express'
import { body, param, query } from 'express-validator'
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getHighRiskTransactions,
  getTransactionStatistics,
  markAsFraud,
  markAsSafe
} from '../controllers/transactionController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validateRequest } from '../middlewares/validation.js'
import { createLimiter } from '../middlewares/rateLimiter.js'

const router = express.Router()

// Apply authentication to all routes
router.use(authenticate)

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions with filtering and pagination
 * @access  Private (read permission)
 */
router.get('/',
  authorize([], ['read']),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['SAFE', 'SUSPICIOUS', 'FRAUD']),
    query('minRiskScore').optional().isFloat({ min: 0, max: 100 }),
    query('maxRiskScore').optional().isFloat({ min: 0, max: 100 }),
    query('sortBy').optional().isIn(['createdAt', 'amount', 'riskScore', 'status']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  validateRequest,
  getTransactions
)

/**
 * @route   GET /api/transactions/high-risk
 * @desc    Get high-risk transactions
 * @access  Private (read permission)
 */
router.get('/high-risk',
  authorize([], ['read']),
  [
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  getHighRiskTransactions
)

/**
 * @route   GET /api/transactions/statistics
 * @desc    Get transaction statistics
 * @access  Private (read permission)
 */
router.get('/statistics',
  authorize([], ['read']),
  getTransactionStatistics
)

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private (read permission)
 */
router.get('/:id',
  authorize([], ['read']),
  [
    param('id').isMongoId().withMessage('Invalid transaction ID')
  ],
  validateRequest,
  getTransactionById
)

/**
 * @route   POST /api/transactions
 * @desc    Create new transaction
 * @access  Private (write permission)
 */
router.post('/',
  authorize([], ['write']),
  createLimiter,
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('riskScore').isFloat({ min: 0, max: 100 }).withMessage('Risk score must be between 0 and 100'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('status').optional().isIn(['SAFE', 'SUSPICIOUS', 'FRAUD']),
    body('paymentMethod').optional().isIn(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'OTHER']),
    body('merchantId').optional().notEmpty(),
    body('merchantName').optional().notEmpty()
  ],
  validateRequest,
  createTransaction
)

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Private (write permission)
 */
router.put('/:id',
  authorize([], ['write']),
  [
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    body('amount').optional().isFloat({ min: 0 }),
    body('riskScore').optional().isFloat({ min: 0, max: 100 }),
    body('status').optional().isIn(['SAFE', 'SUSPICIOUS', 'FRAUD']),
    body('paymentMethod').optional().isIn(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'OTHER'])
  ],
  validateRequest,
  updateTransaction
)

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private (delete permission)
 */
router.delete('/:id',
  authorize([], ['delete']),
  [
    param('id').isMongoId().withMessage('Invalid transaction ID')
  ],
  validateRequest,
  deleteTransaction
)

/**
 * @route   POST /api/transactions/:id/mark-fraud
 * @desc    Mark transaction as fraud
 * @access  Private (review_transactions permission)
 */
router.post('/:id/mark-fraud',
  authorize([], ['review_transactions']),
  [
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    body('notes').optional().isString()
  ],
  validateRequest,
  markAsFraud
)

/**
 * @route   POST /api/transactions/:id/mark-safe
 * @desc    Mark transaction as safe
 * @access  Private (review_transactions permission)
 */
router.post('/:id/mark-safe',
  authorize([], ['review_transactions']),
  [
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    body('notes').optional().isString()
  ],
  validateRequest,
  markAsSafe
)

export default router