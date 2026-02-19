import { ApiError } from '../utils/ApiError.js'

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required')
    }

    // If no roles specified, just check if user is authenticated
    if (roles.length === 0) {
      return next()
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Access denied. Required role: ${roles.join(' or ')}`)
    }

    next()
  }
}

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required')
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      throw new ApiError(403, `Access denied. Required permission: ${permission}`)
    }

    next()
  }
}