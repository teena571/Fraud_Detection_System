import ActivityLog from '../models/ActivityLog.js'

/**
 * Middleware to automatically log admin activities
 * Add this after successful operations in controllers
 */
export const logActivity = (action, getDescription) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res)

    // Override json method to log after successful response
    res.json = function(data) {
      // Only log if response is successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log activity asynchronously (don't wait)
        ActivityLog.logActivity({
          userId: req.user?.id,
          userName: req.user?.name || 'Unknown',
          userEmail: req.user?.email || 'unknown@example.com',
          action,
          actionDescription: typeof getDescription === 'function' 
            ? getDescription(req, data) 
            : getDescription,
          targetType: determineTargetType(action),
          targetId: req.params?.id || null,
          targetName: data?.data?.name || data?.data?.email || null,
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: sanitizeBody(req.body)
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: 'SUCCESS'
        }).catch(err => {
          console.error('Failed to log activity:', err)
        })
      }

      // Call original json method
      return originalJson(data)
    }

    next()
  }
}

/**
 * Helper to determine target type from action
 */
function determineTargetType(action) {
  if (action.includes('USER')) return 'USER'
  if (action.includes('RULE')) return 'RULE'
  if (action.includes('ALERT')) return 'ALERT'
  if (action.includes('TRANSACTION')) return 'TRANSACTION'
  if (action.includes('PROFILE') || action.includes('PASSWORD') || action.includes('AVATAR')) return 'PROFILE'
  if (action.includes('SYSTEM') || action.includes('SETTINGS')) return 'SYSTEM'
  return 'OTHER'
}

/**
 * Helper to sanitize request body (remove sensitive data)
 */
function sanitizeBody(body) {
  if (!body) return {}
  
  const sanitized = { ...body }
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'secret']
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  })
  
  return sanitized
}

/**
 * Helper function to manually log activity
 */
export const manualLogActivity = async (req, action, description, additionalData = {}) => {
  try {
    await ActivityLog.logActivity({
      userId: req.user?.id,
      userName: req.user?.name || 'Unknown',
      userEmail: req.user?.email || 'unknown@example.com',
      action,
      actionDescription: description,
      targetType: determineTargetType(action),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'SUCCESS',
      ...additionalData
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

export default {
  logActivity,
  manualLogActivity
}
