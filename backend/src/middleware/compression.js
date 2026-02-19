import compression from 'compression'

/**
 * Advanced compression middleware with custom configuration
 * Optimized for production performance
 */

/**
 * Compression filter - determines what to compress
 */
const shouldCompress = (req, res) => {
  // Don't compress if client doesn't support it
  if (req.headers['x-no-compression']) {
    return false
  }

  // Don't compress WebSocket upgrade requests
  if (req.headers.upgrade === 'websocket') {
    return false
  }

  // Don't compress small responses (< 1KB)
  const contentLength = res.getHeader('Content-Length')
  if (contentLength && parseInt(contentLength) < 1024) {
    return false
  }

  // Don't compress already compressed content
  const contentType = res.getHeader('Content-Type')
  if (contentType) {
    const type = contentType.toString().toLowerCase()
    const compressedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/',
      'audio/',
      'application/zip',
      'application/gzip',
      'application/x-gzip'
    ]
    
    if (compressedTypes.some(t => type.includes(t))) {
      return false
    }
  }

  // Use compression's default filter for everything else
  return compression.filter(req, res)
}

/**
 * Production-optimized compression middleware
 */
export const compressionMiddleware = compression({
  // Compression level (0-9)
  // 6 is a good balance between speed and compression ratio
  level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
  
  // Minimum response size to compress (in bytes)
  threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024, // 1KB
  
  // Custom filter function
  filter: shouldCompress,
  
  // Memory level (1-9)
  // Higher = more memory, better compression
  memLevel: 8,
  
  // Compression strategy
  strategy: compression.Z_DEFAULT_STRATEGY,
  
  // Chunk size for streaming compression
  chunkSize: 16 * 1024, // 16KB chunks
})

/**
 * Aggressive compression for specific routes (e.g., large data exports)
 */
export const aggressiveCompression = compression({
  level: 9, // Maximum compression
  threshold: 512, // Compress anything > 512 bytes
  filter: shouldCompress,
  memLevel: 9
})

/**
 * Fast compression for real-time data (e.g., WebSocket fallback)
 */
export const fastCompression = compression({
  level: 1, // Fastest compression
  threshold: 2048, // Only compress larger responses
  filter: shouldCompress,
  memLevel: 7
})

/**
 * Middleware to add compression info to response headers (development only)
 */
export const compressionLogger = (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return next()
  }

  const originalWrite = res.write
  const originalEnd = res.end
  let uncompressedSize = 0
  let compressedSize = 0

  res.write = function(chunk, ...args) {
    if (chunk) {
      uncompressedSize += chunk.length
    }
    return originalWrite.apply(res, [chunk, ...args])
  }

  res.end = function(chunk, ...args) {
    if (chunk) {
      uncompressedSize += chunk.length
    }
    
    const contentEncoding = res.getHeader('Content-Encoding')
    if (contentEncoding && uncompressedSize > 0) {
      compressedSize = parseInt(res.getHeader('Content-Length') || 0)
      const ratio = ((1 - compressedSize / uncompressedSize) * 100).toFixed(1)
      
      res.setHeader('X-Uncompressed-Size', uncompressedSize)
      res.setHeader('X-Compressed-Size', compressedSize)
      res.setHeader('X-Compression-Ratio', `${ratio}%`)
      
      console.log(`📦 Compression: ${uncompressedSize}B → ${compressedSize}B (${ratio}% reduction)`)
    }
    
    return originalEnd.apply(res, [chunk, ...args])
  }

  next()
}

export default {
  compressionMiddleware,
  aggressiveCompression,
  fastCompression,
  compressionLogger
}
