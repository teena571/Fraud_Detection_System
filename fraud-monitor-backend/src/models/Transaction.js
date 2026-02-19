import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['SAFE', 'SUSPICIOUS', 'FRAUD'],
    default: 'SAFE',
    index: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    index: true
  },
  merchantId: {
    type: String,
    index: true
  },
  merchantName: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'OTHER'],
    default: 'CREDIT_CARD'
  },
  location: {
    country: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  deviceInfo: {
    deviceId: String,
    userAgent: String,
    ipAddress: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  flags: [{
    type: String,
    reason: String,
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  processedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: String
  },
  reviewedAt: {
    type: Date
  },
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for performance
transactionSchema.index({ createdAt: -1 })
transactionSchema.index({ userId: 1, createdAt: -1 })
transactionSchema.index({ status: 1, riskScore: -1 })
transactionSchema.index({ 'location.country': 1 })
transactionSchema.index({ amount: -1 })

// Virtual for risk level
transactionSchema.virtual('riskLevel').get(function() {
  if (this.riskScore >= 80) return 'CRITICAL'
  if (this.riskScore >= 60) return 'HIGH'
  if (this.riskScore >= 40) return 'MEDIUM'
  return 'LOW'
})

// Virtual for is high risk
transactionSchema.virtual('isHighRisk').get(function() {
  return this.riskScore > 70
})

// Static methods
transactionSchema.statics.findHighRisk = function(limit = 50) {
  return this.find({ riskScore: { $gt: 70 } })
    .sort({ riskScore: -1, createdAt: -1 })
    .limit(limit)
}

transactionSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ userId })
  
  if (options.status) {
    query.where('status', options.status)
  }
  
  if (options.minRiskScore) {
    query.where('riskScore').gte(options.minRiskScore)
  }
  
  return query.sort({ createdAt: -1 })
}

transactionSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgRiskScore: { $avg: '$riskScore' },
        safeCount: {
          $sum: { $cond: [{ $eq: ['$status', 'SAFE'] }, 1, 0] }
        },
        suspiciousCount: {
          $sum: { $cond: [{ $eq: ['$status', 'SUSPICIOUS'] }, 1, 0] }
        },
        fraudCount: {
          $sum: { $cond: [{ $eq: ['$status', 'FRAUD'] }, 1, 0] }
        },
        highRiskCount: {
          $sum: { $cond: [{ $gt: ['$riskScore', 70] }, 1, 0] }
        }
      }
    }
  ])
  
  return stats[0] || {
    totalTransactions: 0,
    totalAmount: 0,
    avgRiskScore: 0,
    safeCount: 0,
    suspiciousCount: 0,
    fraudCount: 0,
    highRiskCount: 0
  }
}

// Instance methods
transactionSchema.methods.markAsFraud = function(reviewerId, notes) {
  this.status = 'FRAUD'
  this.reviewedBy = reviewerId
  this.reviewedAt = new Date()
  if (notes) this.notes = notes
  return this.save()
}

transactionSchema.methods.markAsSafe = function(reviewerId, notes) {
  this.status = 'SAFE'
  this.reviewedBy = reviewerId
  this.reviewedAt = new Date()
  if (notes) this.notes = notes
  return this.save()
}

transactionSchema.methods.addFlag = function(type, reason, severity = 'MEDIUM') {
  this.flags.push({
    type,
    reason,
    severity,
    timestamp: new Date()
  })
  return this.save()
}

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Auto-set status based on risk score if not manually set
  if (this.isNew && !this.isModified('status')) {
    if (this.riskScore >= 80) {
      this.status = 'FRAUD'
    } else if (this.riskScore >= 50) {
      this.status = 'SUSPICIOUS'
    }
  }
  
  next()
})

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction