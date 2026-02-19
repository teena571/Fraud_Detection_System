import helmet from 'helmet'

/**
 * Production-ready security middleware configuration
 * Implements security best practices and headers
 */

/**
 * Comprehensive helmet configuration for production
 */
export const securityMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { 
    policy: process.env.CORP_POLICY || "cross-origin" 
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disabled for WebSocket compatibility
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { 
    policy: "same-origin-allow-popups" 
  },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { 
    allow: false 
  },
  
  // Expect-CT (Certificate Transparency)
  expectCt: {
    maxAge: 86400, // 24 hours
    enforce: true
  },
  
  // Frameguard (X-Frame-Options)
  frameguard: { 
    action: 'deny' 
  },
  
  // Hide Powered By
  hidePoweredBy: true,
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff (X-Content-Type-Options)
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { 
    permittedPolicies: "none" 
  },
  
  // Referrer Policy
  referrerPolicy: { 
    policy: "strict-origin-when-cross-origin" 
  },
  
  // XSS Filter
  xssFilter: true,
})

/**
 * Additional security headers middleware
 */
export const additionalSecurityHeaders = (req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By')
  res.removeHeader('Server')
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  
  // Permissions Policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  )
  
  // Cache control for sensitive data
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
  
  next()
}

/**
 * Request sanitization middleware
 * Prevents common injection attacks
 */
export const sanitizeRequest = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        // Remove potential XSS patterns
        req.query[key] = req.query[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
      }
    }
  }
  
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body)
  }
  
  next()
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key])
    }
  }
}

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (req, res, next) => {
  const whitelist = process.env.IP_WHITELIST?.split(',') || []
  
  if (whitelist.length === 0) {
    return next()
  }
  
  const clientIp = req.ip || req.connection.remoteAddress
  
  if (whitelist.includes(clientIp)) {
    return next()
  }
  
  console.warn(`⚠️ Blocked request from non-whitelisted IP: ${clientIp}`)
  res.status(403).json({
    success: false,
    message: 'Access denied'
  })
}

/**
 * Request size limiter
 */
export const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length']
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024)
      const maxSizeInMB = parseInt(maxSize)
      
      if (sizeInMB > maxSizeInMB) {
        console.warn(`⚠️ Request too large: ${sizeInMB.toFixed(2)}MB (max: ${maxSizeInMB}MB)`)
        return res.status(413).json({
          success: false,
          message: 'Request entity too large',
          maxSize: maxSize
        })
      }
    }
    
    next()
  }
}

export default {
  securityMiddleware,
  additionalSecurityHeaders,
  sanitizeRequest,
  ipWhitelist,
  requestSizeLimiter
}
