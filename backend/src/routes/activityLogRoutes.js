import express from 'express'
import { param, query } from 'express-validator'
import {
  getActivityLogs,
  getActivityStats,
  getActivityLogById,
  deleteActivityLog,
  cleanupOldLogs
} from '../controllers/activityLogController.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validation.js'

const router = express.Router()

/**
 * @route   GET /api/admin/activity
 * @desc    Get all activity logs
 * @access  Private (Admin)
 */
router.get('/',
  authenticate,
  authorize(['admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().trim(),
  query('action').optional().isString(),
  query('status').optional().isIn(['SUCCESS', 'FAILURE', 'PENDING', 'all']).withMessage('Invalid status'),
  query('userId').optional().isMongoId().withMessage('Invalid user ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  validateRequest,
  getActivityLogs
)

/**
 * @route   GET /api/admin/activity/stats
 * @desc    Get activity log statistics
 * @access  Private (Admin)
 */
router.get('/stats',
  authenticate,
  authorize(['admin']),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  validateRequest,
  getActivityStats
)

/**
 * @route   GET /api/admin/activity/:id
 * @desc    Get single activity log
 * @access  Private (Admin)
 */
router.get('/:id',
  authenticate,
  authorize(['admin']),
  param('id').isMongoId().withMessage('Invalid activity log ID'),
  validateRequest,
  getActivityLogById
)

/**
 * @route   DELETE /api/admin/activity/cleanup
 * @desc    Delete old activity logs
 * @access  Private (Admin)
 */
router.delete('/cleanup',
  authenticate,
  authorize(['admin']),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  validateRequest,
  cleanupOldLogs
)

/**
 * @route   DELETE /api/admin/activity/:id
 * @desc    Delete single activity log
 * @access  Private (Admin)
 */
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  param('id').isMongoId().withMessage('Invalid activity log ID'),
  validateRequest,
  deleteActivityLog
)

export default router
