import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'PROFILE_UPDATE',
      'PASSWORD_CHANGE',
      'AVATAR_UPLOAD',
      'AVATAR_DELETE',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_BLOCK',
      'USER_UNBLOCK',
      'USER_DELETE',
      'RULE_CREATE',
      'RULE_UPDATE',
      'RULE_DELETE',
      'ALERT_UPDATE',
      'ALERT_DELETE',
      'TRANSACTION_UPDATE',
      'SETTINGS_UPDATE',
      'SYSTEM_CONFIG',
      'OTHER'
    ],
    index: true
  },
  actionDescription: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['USER', 'RULE', 'ALERT', 'TRANSACTION', 'SYSTEM', 'PROFILE', 'OTHER'],
    default: 'OTHER'
  },
  targetId: {
    type: String,
    default: null
  },
  targetName: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'PENDING'],
    default: 'SUCCESS'
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
})

// Indexes for efficient querying
activityLogSchema.index({ createdAt: -1 })
activityLogSchema.index({ userId: 1, createdAt: -1 })
activityLogSchema.index({ action: 1, createdAt: -1 })
activityLogSchema.index({ status: 1, createdAt: -1 })

// Static method to log activity
activityLogSchema.statics.logActivity = async function({
  userId,
  userName,
  userEmail,
  action,
  actionDescription,
  targetType = 'OTHER',
  targetId = null,
  targetName = null,
  metadata = {},
  ipAddress = null,
  userAgent = null,
  status = 'SUCCESS',
  errorMessage = null
}) {
  try {
    const log = await this.create({
      userId,
      userName,
      userEmail,
      action,
      actionDescription,
      targetType,
      targetId,
      targetName,
      metadata,
      ipAddress,
      userAgent,
      status,
      errorMessage
    })
    return log
  } catch (error) {
    console.error('Failed to log activity:', error)
    return null
  }
}

// Static method to get user's recent activities
activityLogSchema.statics.getUserActivities = async function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
}

// Static method to get activities by action type
activityLogSchema.statics.getActivitiesByAction = async function(action, limit = 100) {
  return this.find({ action })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
}

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)

export default ActivityLog
