import User from '../models/User.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { generateToken, blacklistToken } from '../middlewares/auth.js'
import logger from '../config/logger.js'

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body

  // Check if user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new ApiError(409, 'User already exists with this email')
  }

  // Create user
  const user = new User({
    email,
    password,
    firstName,
    lastName,
    role: role || 'viewer'
  })

  // Set default permissions based on role
  switch (user.role) {
    case 'admin':
      user.permissions = ['read', 'write', 'delete', 'admin', 'review_transactions', 'manage_rules']
      break
    case 'analyst':
      user.permissions = ['read', 'write', 'review_transactions']
      break
    case 'viewer':
      user.permissions = ['read']
      break
  }

  await user.save()

  // Generate token
  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  })

  logger.info(`New user registered: ${user.email}`)

  res.status(201).json(new ApiResponse(201, {
    user,
    token
  }, 'User registered successfully'))
})

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Find user
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new ApiError(401, 'Invalid credentials')
  }

  // Check if account is locked
  if (user.isLocked) {
    throw new ApiError(423, 'Account is temporarily locked due to too many failed login attempts')
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated')
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password)
  if (!isPasswordValid) {
    await user.incLoginAttempts()
    throw new ApiError(401, 'Invalid credentials')
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts()
  }

  // Update last login
  user.lastLogin = new Date()
  await user.save()

  // Generate token
  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  })

  logger.info(`User logged in: ${user.email}`)

  res.json(new ApiResponse(200, {
    user,
    token
  }, 'Login successful'))
})

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  if (token) {
    await blacklistToken(token)
  }

  res.json(new ApiResponse(200, null, 'Logout successful'))
})

/**
 * Get current user profile
 * GET /api/auth/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res.json(new ApiResponse(200, user, 'Profile retrieved successfully'))
})

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body

  const user = await User.findById(req.user.id)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  // Update allowed fields
  if (firstName) user.firstName = firstName
  if (lastName) user.lastName = lastName

  await user.save()

  res.json(new ApiResponse(200, user, 'Profile updated successfully'))
})

/**
 * Change password
 * PUT /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  const user = await User.findById(req.user.id).select('+password')
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword)
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'Current password is incorrect')
  }

  // Update password
  user.password = newPassword
  await user.save()

  logger.info(`Password changed for user: ${user.email}`)

  res.json(new ApiResponse(200, null, 'Password changed successfully'))
})

/**
 * Refresh token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive')
  }

  // Generate new token
  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  })

  res.json(new ApiResponse(200, { token }, 'Token refreshed successfully'))
})