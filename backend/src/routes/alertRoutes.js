import express from 'express'
import { body, param, query } from 'express-validator'
import {
  getAlerts,
  getAlertById,
  deleteAlert,
  getActiveAlerts,
  getCriticalAlerts,
  getAlertsByTransaction,
  getAlertStats,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert
} from '../controllers/alertController.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validation.js'
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js'

const router = express.Router()

// Validation schemas
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('severity')
    .optional()
    .custom(value => {
      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
      if (Array.isArray(value)) {
        return value.every(sev => validSeverities.includes(sev))
      }
      return validSeverities.includes(value)
    })
    .withMessage('Invalid severity value'),

  query('status')
    .optional()
    .custom(value => {
      const validStatuses = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']
      if (Array.isArray(value)) {
        return value.every(stat => validStatuses.includes(stat))
      }
      return validStatuses.includes(value)
    })
    .withMessage('Invalid status value'),

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
    .isIn(['createdAt', 'severity', 'status', 'transactionAmount', 'transactionRiskScore'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
]

const actionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid alert ID'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
]

// Routes

/**
 * @route   GET /api/alerts/stats
 * @desc    Get alert statistics
 * @access  Private
 */
router.get('/stats',
  authenticate,
  cacheMiddleware({ ttl: 60, keyPrefix: 'alert-stats', includeQuery: false }),
  getAlertStats
)

/**
 * @route   GET /api/alerts/active
 * @desc    Get active alerts
 * @access  Private
 */
router.get('/active',
  authenticate,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest,
  cacheMiddleware({ ttl: 60, keyPrefix: 'alerts-active', includeQuery: true }),
  getActiveAlerts
)

/**
 * @route   GET /api/alerts/critical
 * @desc    Get critical alerts
 * @access  Private
 */
router.get('/critical',
  authenticate,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest,
  cacheMiddleware({ ttl: 60, keyPrefix: 'alerts-critical', includeQuery: true }),
  getCriticalAlerts
)

/**
 * @route   GET /api/alerts/transaction/:transactionId
 * @desc    Get alerts by transaction ID
 * @access  Private
 */
router.get('/transaction/:transactionId',
  authenticate,
  param('transactionId').notEmpty().withMessage('Transaction ID is required'),
  validateRequest,
  cacheMiddleware({ ttl: 60, keyPrefix: 'alerts-transaction', includeQuery: false }),
  getAlertsByTransaction
)

/**
 * @route   GET /api/alerts
 * @desc    Get all alerts with pagination and filters
 * @access  Private
 */
router.get('/',
  authenticate,
  queryValidation,
  validateRequest,
  cacheMiddleware({ ttl: 60, keyPrefix: 'alerts', includeQuery: true }),
  getAlerts
)

/**
 * @route   GET /api/alerts/:id
 * @desc    Get single alert by ID
 * @access  Private
 */
router.get('/:id',
  authenticate,
  param('id').isMongoId().withMessage('Invalid alert ID'),
  validateRequest,
  cacheMiddleware({ ttl: 60, keyPrefix: 'alert', includeQuery: false }),
  getAlertById
)

/**
 * @route   POST /api/alerts/:id/acknowledge
 * @desc    Acknowledge alert
 * @access  Private
 */
router.post('/:id/acknowledge',
  authenticate,
  param('id').isMongoId().withMessage('Invalid alert ID'),
  validateRequest,
  invalidateCache(['alerts:*', 'alert:*', 'alerts-active:*', 'alerts-critical:*', 'alert-stats:*']),
  acknowledgeAlert
)

/**
 * @route   POST /api/alerts/:id/resolve
 * @desc    Resolve alert
 * @access  Private
 */
router.post('/:id/resolve',
  authenticate,
  actionValidation,
  validateRequest,
  invalidateCache(['alerts:*', 'alert:*', 'alerts-active:*', 'alerts-critical:*', 'alert-stats:*']),
  resolveAlert
)

/**
 * @route   POST /api/alerts/:id/dismiss
 * @desc    Dismiss alert
 * @access  Private
 */
router.post('/:id/dismiss',
  authenticate,
  actionValidation,
  validateRequest,
  invalidateCache(['alerts:*', 'alert:*', 'alerts-active:*', 'alerts-critical:*', 'alert-stats:*']),
  dismissAlert
)

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Delete alert
 * @access  Private (Admin)
 */
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  param('id').isMongoId().withMessage('Invalid alert ID'),
  validateRequest,
  invalidateCache(['alerts:*', 'alert:*', 'alerts-active:*', 'alerts-critical:*', 'alert-stats:*']),
  deleteAlert
)

export default router