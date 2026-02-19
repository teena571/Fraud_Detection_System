import express from 'express'
import { body, param, query } from 'express-validator'
import {
  getAdminProfile,
  updateAdminProfile,
  uploadAvatar,
  deleteAvatar,
  getAllUsers,
  getUserById,
  toggleUserBlock,
  deleteUser,
  getUserTransactions
} from '../controllers/adminController.js'
import { getSystemHealth } from '../controllers/healthController.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validation.js'

const router = express.Router()

// Validation schemas
const updateProfileValidation = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('currentPassword')
    .optional()
    .isString()
    .withMessage('Current password must be a string'),

  body('newPassword')
    .optional()
    .isString()
    .withMessage('New password must be a string')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),

  body('avatar')
    .optional()
    .isString()
    .withMessage('Avatar must be a string')
]

const uploadAvatarValidation = [
  body('avatar')
    .notEmpty()
    .withMessage('Avatar is required')
    .isString()
    .withMessage('Avatar must be a string')
]

// Routes

/**
 * @route   GET /api/admin/profile
 * @desc    Get admin profile
 * @access  Private (Admin)
 */
router.get('/profile',
  authenticate,
  authorize(['admin']),
  getAdminProfile
)

/**
 * @route   PUT /api/admin/profile
 * @desc    Update admin profile
 * @access  Private (Admin)
 */
router.put('/profile',
  authenticate,
  authorize(['admin']),
  updateProfileValidation,
  validateRequest,
  updateAdminProfile
)

/**
 * @route   POST /api/admin/avatar
 * @desc    Upload avatar
 * @access  Private (Admin)
 */
router.post('/avatar',
  authenticate,
  authorize(['admin']),
  uploadAvatarValidation,
  validateRequest,
  uploadAvatar
)

/**
 * @route   DELETE /api/admin/avatar
 * @desc    Delete avatar
 * @access  Private (Admin)
 */
router.delete('/avatar',
  authenticate,
  authorize(['admin']),
  deleteAvatar
)

// User Management Routes

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/users',
  authenticate,
  authorize(['admin']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().trim(),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  query('role').optional().isIn(['admin', 'analyst', 'viewer', 'system']).withMessage('Invalid role'),
  validateRequest,
  getAllUsers
)

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user
 * @access  Private (Admin)
 */
router.get('/users/:id',
  authenticate,
  authorize(['admin']),
  param('id').isMongoId().withMessage('Invalid user ID'),
  validateRequest,
  getUserById
)

/**
 * @route   GET /api/admin/users/:id/transactions
 * @desc    Get user transaction history
 * @access  Private (Admin)
 */
router.get('/users/:id/transactions',
  authenticate,
  authorize(['admin']),
  param('id').isMongoId().withMessage('Invalid user ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest,
  getUserTransactions
)

/**
 * @route   PUT /api/admin/users/:id/block
 * @desc    Block/Unblock user
 * @access  Private (Admin)
 */
router.put('/users/:id/block',
  authenticate,
  authorize(['admin']),
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  validateRequest,
  toggleUserBlock
)

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete('/users/:id',
  authenticate,
  authorize(['admin']),
  param('id').isMongoId().withMessage('Invalid user ID'),
  validateRequest,
  deleteUser
)

/**
 * @route   GET /api/admin/health
 * @desc    Get system health status
 * @access  Private (Admin)
 */
router.get('/health',
  authenticate,
  authorize(['admin']),
  getSystemHealth
)

export default router
