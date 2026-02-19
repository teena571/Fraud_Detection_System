import User from '../models/User.js'
import { validationResult } from 'express-validator'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import bcrypt from 'bcryptjs'

/**
 * Get admin profile
 * GET /api/admin/profile
 */
export const getAdminProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiError(401, 'User not authenticated')
  }

  const user = await User.findById(userId).select('-password')

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res.json(new ApiResponse(200, user, 'Profile retrieved successfully'))
})

/**
 * Update admin profile
 * PUT /api/admin/profile
 */
export const updateAdminProfile = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array())
  }

  const userId = req.user?.id

  if (!userId) {
    throw new ApiError(401, 'User not authenticated')
  }

  const { name, email, currentPassword, newPassword, avatar } = req.body

  // Find user
  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  // If changing password, verify current password
  if (newPassword) {
    if (!currentPassword) {
      throw new ApiError(400, 'Current password is required to change password')
    }

    const isPasswordValid = await user.comparePassword(currentPassword)
    
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect')
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
  }

  // Update other fields
  if (name) user.name = name
  if (email) {
    // Check if email already exists
    const existingUser = await User.findOne({ email, _id: { $ne: userId } })
    if (existingUser) {
      throw new ApiError(409, 'Email already in use')
    }
    user.email = email
  }
  if (avatar) user.avatar = avatar

  // Save user
  await user.save()

  // Return user without password
  const updatedUser = await User.findById(userId).select('-password')

  res.json(new ApiResponse(200, updatedUser, 'Profile updated successfully'))
})

/**
 * Upload avatar
 * POST /api/admin/avatar
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiError(401, 'User not authenticated')
  }

  const { avatar } = req.body

  if (!avatar) {
    throw new ApiError(400, 'Avatar data is required')
  }

  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  user.avatar = avatar
  await user.save()

  const updatedUser = await User.findById(userId).select('-password')

  res.json(new ApiResponse(200, updatedUser, 'Avatar updated successfully'))
})

/**
 * Delete avatar
 * DELETE /api/admin/avatar
 */
export const deleteAvatar = asyncHandler(async (req, res) => {
  const userId = req.user?.id

  if (!userId) {
    throw new ApiError(401, 'User not authenticated')
  }

  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  user.avatar = null
  await user.save()

  const updatedUser = await User.findById(userId).select('-password')

  res.json(new ApiResponse(200, updatedUser, 'Avatar deleted successfully'))
})

/**
 * Get all users
 * GET /api/admin/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    role,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  // Build filter
  const filter = {}

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  if (status) {
    filter.isActive = status === 'active'
  }

  if (role) {
    filter.role = role
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  // Sort
  const sortOptions = {}
  const validSortFields = ['createdAt', 'name', 'email', 'lastLogin']
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
  sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1

  // Execute query
  const [users, totalCount] = await Promise.all([
    User.find(filter)
      .select('-password -passwordResetToken')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter)
  ])

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / limitNum)

  res.json(new ApiResponse(200, {
    users,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }
  }, 'Users retrieved successfully'))
})

/**
 * Get single user
 * GET /api/admin/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await User.findById(id).select('-password -passwordResetToken')

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res.json(new ApiResponse(200, user, 'User retrieved successfully'))
})

/**
 * Block/Unblock user
 * PUT /api/admin/users/:id/block
 */
export const toggleUserBlock = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { isActive } = req.body

  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be a boolean')
  }

  const user = await User.findById(id)

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  // Prevent blocking yourself
  if (user._id.toString() === req.user?.id) {
    throw new ApiError(400, 'Cannot block yourself')
  }

  user.isActive = isActive
  user.updatedBy = req.user?.id || 'system'
  await user.save()

  const updatedUser = await User.findById(id).select('-password -passwordResetToken')

  res.json(new ApiResponse(200, updatedUser, `User ${isActive ? 'unblocked' : 'blocked'} successfully`))
})

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await User.findById(id)

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  // Prevent deleting yourself
  if (user._id.toString() === req.user?.id) {
    throw new ApiError(400, 'Cannot delete yourself')
  }

  await User.findByIdAndDelete(id)

  res.json(new ApiResponse(200, null, 'User deleted successfully'))
})

/**
 * Get user transaction history
 * GET /api/admin/users/:id/transactions
 */
export const getUserTransactions = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { page = 1, limit = 10 } = req.query

  // Check if user exists
  const user = await User.findById(id)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  // Import Transaction model dynamically to avoid circular dependency
  const Transaction = (await import('../models/Transaction.js')).default

  // Pagination
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  // Get transactions for this user
  const [transactions, totalCount] = await Promise.all([
    Transaction.find({ userId: user.email })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Transaction.countDocuments({ userId: user.email })
  ])

  const totalPages = Math.ceil(totalCount / limitNum)

  res.json(new ApiResponse(200, {
    transactions,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum
    }
  }, 'User transactions retrieved successfully'))
})

export default {
  getAdminProfile,
  updateAdminProfile,
  uploadAvatar,
  deleteAvatar,
  getAllUsers,
  getUserById,
  toggleUserBlock,
  deleteUser,
  getUserTransactions
}
