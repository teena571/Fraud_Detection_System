import ActivityLog from '../models/ActivityLog.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * Get all activity logs
 * GET /api/admin/activity
 */
export const getActivityLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    action,
    status,
    userId,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  // Build filter
  const filter = {}

  // Search in action description, user name, or user email
  if (search) {
    filter.$or = [
      { actionDescription: { $regex: search, $options: 'i' } },
      { userName: { $regex: search, $options: 'i' } },
      { userEmail: { $regex: search, $options: 'i' } },
      { targetName: { $regex: search, $options: 'i' } }
    ]
  }

  // Filter by action type
  if (action && action !== 'all') {
    filter.action = action
  }

  // Filter by status
  if (status && status !== 'all') {
    filter.status = status
  }

  // Filter by user
  if (userId) {
    filter.userId = userId
  }

  // Filter by date range
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate)
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate)
    }
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  // Sort
  const sortOptions = {}
  const validSortFields = ['createdAt', 'action', 'userName', 'status']
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
  sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1

  // Execute query
  const [logs, totalCount] = await Promise.all([
    ActivityLog.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ActivityLog.countDocuments(filter)
  ])

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / limitNum)

  res.json(new ApiResponse(200, {
    logs,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }
  }, 'Activity logs retrieved successfully'))
})

/**
 * Get activity log statistics
 * GET /api/admin/activity/stats
 */
export const getActivityStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query

  // Build date filter
  const dateFilter = {}
  if (startDate || endDate) {
    dateFilter.createdAt = {}
    if (startDate) {
      dateFilter.createdAt.$gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.createdAt.$lte = new Date(endDate)
    }
  }

  // Get statistics
  const [
    totalLogs,
    actionCounts,
    statusCounts,
    recentLogs,
    topUsers
  ] = await Promise.all([
    // Total logs count
    ActivityLog.countDocuments(dateFilter),

    // Count by action type
    ActivityLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),

    // Count by status
    ActivityLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Recent logs
    ActivityLog.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    // Top active users
    ActivityLog.aggregate([
      { $match: dateFilter },
      { $group: { 
        _id: '$userId', 
        userName: { $first: '$userName' },
        userEmail: { $first: '$userEmail' },
        count: { $sum: 1 } 
      } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ])

  res.json(new ApiResponse(200, {
    totalLogs,
    actionCounts: actionCounts.map(item => ({
      action: item._id,
      count: item.count
    })),
    statusCounts: statusCounts.map(item => ({
      status: item._id,
      count: item.count
    })),
    recentLogs,
    topUsers: topUsers.map(item => ({
      userId: item._id,
      userName: item.userName,
      userEmail: item.userEmail,
      activityCount: item.count
    }))
  }, 'Activity statistics retrieved successfully'))
})

/**
 * Get single activity log
 * GET /api/admin/activity/:id
 */
export const getActivityLogById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const log = await ActivityLog.findById(id).lean()

  if (!log) {
    throw new ApiError(404, 'Activity log not found')
  }

  res.json(new ApiResponse(200, log, 'Activity log retrieved successfully'))
})

/**
 * Delete activity log (admin only, for cleanup)
 * DELETE /api/admin/activity/:id
 */
export const deleteActivityLog = asyncHandler(async (req, res) => {
  const { id } = req.params

  const log = await ActivityLog.findById(id)

  if (!log) {
    throw new ApiError(404, 'Activity log not found')
  }

  await ActivityLog.findByIdAndDelete(id)

  // Log this deletion
  await ActivityLog.logActivity({
    userId: req.user?.id,
    userName: req.user?.name || 'Unknown',
    userEmail: req.user?.email || 'unknown@example.com',
    action: 'OTHER',
    actionDescription: `Deleted activity log: ${log.actionDescription}`,
    targetType: 'SYSTEM',
    targetId: id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  })

  res.json(new ApiResponse(200, null, 'Activity log deleted successfully'))
})

/**
 * Delete old activity logs (cleanup)
 * DELETE /api/admin/activity/cleanup
 */
export const cleanupOldLogs = asyncHandler(async (req, res) => {
  const { days = 90 } = req.query

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days))

  const result = await ActivityLog.deleteMany({
    createdAt: { $lt: cutoffDate }
  })

  // Log this cleanup
  await ActivityLog.logActivity({
    userId: req.user?.id,
    userName: req.user?.name || 'Unknown',
    userEmail: req.user?.email || 'unknown@example.com',
    action: 'SYSTEM_CONFIG',
    actionDescription: `Cleaned up ${result.deletedCount} activity logs older than ${days} days`,
    targetType: 'SYSTEM',
    metadata: { deletedCount: result.deletedCount, days: parseInt(days) },
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  })

  res.json(new ApiResponse(200, {
    deletedCount: result.deletedCount,
    cutoffDate
  }, `Deleted ${result.deletedCount} old activity logs`))
})

export default {
  getActivityLogs,
  getActivityStats,
  getActivityLogById,
  deleteActivityLog,
  cleanupOldLogs
}
