import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  severity: {
    type: String,
    required: true,
    enum: {
      values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      message: 'Severity must be one of: LOW, MEDIUM, HIGH, CRITICAL'
    },
    default: 'MEDIUM',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Additional useful fields
  transactionAmount: {
    type: Number,
    min: 0
  },
  transactionRiskScore: {
    type: Number,
    min: 0,
    max: 100
  },
  userId: {
    type: String,
    index: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'],
    default: 'ACTIVE',
    index: true
  },
  acknowledgedBy: {
    type: String,
    trim: true
  },
  acknowledgedAt: {
    type: Date
  },
  resolvedBy: {
    type: String,
    trim: true
  },
  resolvedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: false, // We're using custom createdAt
  versionKey: false,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id
      delete ret._id
      return ret
    }
  },
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id
      delete ret._id
      return ret
    }
  }
})

// Indexes for performance
alertSchema.index({ createdAt: -1 })
alertSchema.index({ severity: 1, createdAt: -1 })
alertSchema.index({ status: 1, createdAt: -1 })
alertSchema.index({ transactionId: 1, createdAt: -1 })
alertSchema.index({ userId: 1, createdAt: -1 })

// Compound index for common queries
alertSchema.index({ 
  status: 1, 
  severity: 1, 
  createdAt: -1 
})

// Static methods
alertSchema.statics.createFromTransaction = async function(transaction) {
  const alerts = []
  
  // Check if alert should be created
  const shouldCreateAlert = transaction.riskScore > 70 || transaction.amount > 50000
  
  if (!shouldCreateAlert) {
    return alerts
  }
  
  // Determine severity based on risk score and amount
  let severity = 'MEDIUM'
  let message = ''
  
  if (transaction.riskScore >= 90 || transaction.amount > 100000) {
    severity = 'CRITICAL'
    message = `CRITICAL: High-risk transaction detected (Risk: ${transaction.riskScore}, Amount: $${transaction.amount})`
  } else if (transaction.riskScore >= 80 || transaction.amount > 75000) {
    severity = 'HIGH'
    message = `HIGH: Suspicious transaction detected (Risk: ${transaction.riskScore}, Amount: $${transaction.amount})`
  } else if (transaction.riskScore > 70 || transaction.amount > 50000) {
    severity = 'MEDIUM'
    message = `MEDIUM: Transaction requires review (Risk: ${transaction.riskScore}, Amount: $${transaction.amount})`
  }
  
  // Create alert
  const alert = new this({
    transactionId: transaction.transactionId,
    message,
    severity,
    transactionAmount: transaction.amount,
    transactionRiskScore: transaction.riskScore,
    userId: transaction.userId,
    status: 'ACTIVE',
    metadata: {
      transactionStatus: transaction.status,
      merchantId: transaction.merchantId,
      paymentMethod: transaction.paymentMethod,
      location: transaction.location
    }
  })
  
  await alert.save()
  alerts.push(alert)
  
  return alerts
}

alertSchema.statics.getActiveAlerts = function(limit = 50) {
  return this.find({ status: 'ACTIVE' })
    .sort({ severity: -1, createdAt: -1 })
    .limit(limit)
    .lean()
}

alertSchema.statics.getCriticalAlerts = function(limit = 20) {
  return this.find({ 
    status: 'ACTIVE',
    severity: { $in: ['CRITICAL', 'HIGH'] }
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
}

alertSchema.statics.getAlertsByTransaction = function(transactionId) {
  return this.find({ transactionId })
    .sort({ createdAt: -1 })
    .lean()
}

alertSchema.statics.getAlertStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalAlerts: { $sum: 1 },
        activeAlerts: {
          $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
        },
        criticalCount: {
          $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
        },
        highCount: {
          $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] }
        },
        mediumCount: {
          $sum: { $cond: [{ $eq: ['$severity', 'MEDIUM'] }, 1, 0] }
        },
        lowCount: {
          $sum: { $cond: [{ $eq: ['$severity', 'LOW'] }, 1, 0] }
        },
        acknowledgedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'ACKNOWLEDGED'] }, 1, 0] }
        },
        resolvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
        },
        dismissedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'DISMISSED'] }, 1, 0] }
        }
      }
    }
  ])
  
  return stats[0] || {
    totalAlerts: 0,
    activeAlerts: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    acknowledgedCount: 0,
    resolvedCount: 0,
    dismissedCount: 0
  }
}

// Instance methods
alertSchema.methods.acknowledge = function(userId) {
  this.status = 'ACKNOWLEDGED'
  this.acknowledgedBy = userId
  this.acknowledgedAt = new Date()
  return this.save()
}

alertSchema.methods.resolve = function(userId, notes) {
  this.status = 'RESOLVED'
  this.resolvedBy = userId
  this.resolvedAt = new Date()
  if (notes) this.notes = notes
  return this.save()
}

alertSchema.methods.dismiss = function(userId, notes) {
  this.status = 'DISMISSED'
  this.resolvedBy = userId
  this.resolvedAt = new Date()
  if (notes) this.notes = notes
  return this.save()
}

const Alert = mongoose.model('Alert', alertSchema)

export default Alert