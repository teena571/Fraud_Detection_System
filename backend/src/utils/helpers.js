import crypto from 'crypto'

/**
 * Generate unique transaction ID
 */
export const generateTransactionId = () => {
  const timestamp = Date.now().toString(36)
  const randomBytes = crypto.randomBytes(6).toString('hex')
  return `TXN_${timestamp}_${randomBytes}`.toUpperCase()
}

/**
 * Calculate risk score based on transaction data
 */
export const calculateRiskScore = (transaction) => {
  let riskScore = 0

  // Amount-based risk (higher amounts = higher risk)
  if (transaction.amount > 10000) {
    riskScore += 30
  } else if (transaction.amount > 5000) {
    riskScore += 20
  } else if (transaction.amount > 1000) {
    riskScore += 10
  }

  // Time-based risk (late night transactions)
  const hour = new Date(transaction.timestamp).getHours()
  if (hour >= 23 || hour <= 5) {
    riskScore += 15
  }

  // Payment method risk
  const paymentMethodRisk = {
    'CREDIT_CARD': 5,
    'DEBIT_CARD': 3,
    'BANK_TRANSFER': 2,
    'DIGITAL_WALLET': 8,
    'OTHER': 20
  }
  riskScore += paymentMethodRisk[transaction.paymentMethod] || 0

  // Location-based risk (simplified)
  if (transaction.location?.country && 
      ['Unknown', 'High-Risk-Country'].includes(transaction.location.country)) {
    riskScore += 25
  }

  // Ensure score is within bounds
  return Math.min(100, Math.max(0, riskScore))
}

/**
 * Format currency amount
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Validate transaction data
 */
export const validateTransactionData = (data) => {
  const errors = []

  if (!data.userId) {
    errors.push('User ID is required')
  }

  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be positive')
  }

  if (data.riskScore !== undefined && (data.riskScore < 0 || data.riskScore > 100)) {
    errors.push('Risk score must be between 0 and 100')
  }

  if (data.status && !['SAFE', 'SUSPICIOUS', 'FRAUD'].includes(data.status)) {
    errors.push('Invalid status')
  }

  return errors
}

/**
 * Generate mock transaction data for testing
 */
export const generateMockTransaction = () => {
  const users = ['user_001', 'user_002', 'user_003', 'user_004', 'user_005']
  const merchants = ['merchant_A', 'merchant_B', 'merchant_C', 'merchant_D']
  const paymentMethods = ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET']
  const countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Unknown']
  const cities = ['New York', 'Toronto', 'London', 'Berlin', 'Paris', 'Unknown']

  const amount = Math.random() * 10000
  const userId = users[Math.floor(Math.random() * users.length)]
  const merchantId = merchants[Math.floor(Math.random() * merchants.length)]
  const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
  const country = countries[Math.floor(Math.random() * countries.length)]
  const city = cities[Math.floor(Math.random() * cities.length)]

  const transaction = {
    transactionId: generateTransactionId(),
    userId,
    amount: Math.round(amount * 100) / 100,
    timestamp: new Date(),
    merchantId,
    paymentMethod,
    location: {
      country,
      city,
      ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    },
    description: `Payment to ${merchantId}`,
    metadata: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      sessionId: crypto.randomBytes(16).toString('hex')
    }
  }

  // Calculate risk score
  transaction.riskScore = calculateRiskScore(transaction)

  // Determine status based on risk score
  if (transaction.riskScore >= 80) {
    transaction.status = 'FRAUD'
  } else if (transaction.riskScore >= 50) {
    transaction.status = 'SUSPICIOUS'
  } else {
    transaction.status = 'SAFE'
  }

  return transaction
}

/**
 * Sanitize query parameters
 */
export const sanitizeQuery = (query) => {
  const sanitized = {}
  
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Build MongoDB aggregation pipeline for analytics
 */
export const buildAnalyticsPipeline = (timeframe = '24h') => {
  const now = new Date()
  let startDate
  let groupBy

  switch (timeframe) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000)
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' },
        minute: { $minute: '$timestamp' }
      }
      break
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      }
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      }
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      }
      break
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      }
  }

  return [
    { $match: { timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgRiskScore: { $avg: '$riskScore' },
        fraudCount: {
          $sum: { $cond: [{ $eq: ['$status', 'FRAUD'] }, 1, 0] }
        },
        suspiciousCount: {
          $sum: { $cond: [{ $eq: ['$status', 'SUSPICIOUS'] }, 1, 0] }
        },
        safeCount: {
          $sum: { $cond: [{ $eq: ['$status', 'SAFE'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ]
}