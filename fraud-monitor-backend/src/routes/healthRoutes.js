import express from 'express'
import {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
  getMetrics,
  getInfo
} from '../controllers/healthController.js'

const router = express.Router()

/**
 * @route   GET /api/health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', healthCheck)

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with all dependencies
 * @access  Public
 */
router.get('/detailed', detailedHealthCheck)

/**
 * @route   GET /api/health/ready
 * @desc    Readiness check for Kubernetes
 * @access  Public
 */
router.get('/ready', readinessCheck)

/**
 * @route   GET /api/health/live
 * @desc    Liveness check for Kubernetes
 * @access  Public
 */
router.get('/live', livenessCheck)

/**
 * @route   GET /api/health/metrics
 * @desc    Get application metrics
 * @access  Public
 */
router.get('/metrics', getMetrics)

/**
 * @route   GET /api/health/info
 * @desc    Get application information
 * @access  Public
 */
router.get('/info', getInfo)

export default router