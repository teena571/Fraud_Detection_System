import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be positive'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0
      },
      message: 'Amount must be a valid positive number'
    }
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['SAFE', 'SUSPICIOUS', 'FRAUD'],
      message: 'Status must be one of: SAFE, SUSPICIOUS, FRAUD'
    },
    default: 'SAFE',
    index: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: [0, 'Risk score must be between 0 and 100'],
    max: [100, 'Risk score must be between 0 and 100'],
    default: 0
  },
  // Additional fields for enhanced functionality
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  merchantId: {
    type: String,
    trim: true,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'OTHER'],
    default: 'OTHER'
  },
  location: {
    country: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true,
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
transactionSchema.index({ userId: 1, timestamp: -1 })
transactionSchema.index({ status: 1, timestamp: -1 })
transactionSchema.index({ riskScore: -1, timestamp: -1 })
transactionSchema.index({ amount: -1, timestamp: -1 })
transactionSchema.index({ createdAt: -1 })

// Compound index for common queries
transactionSchema.index({ 
  status: 1, 
  riskScore: -1, 
  timestamp: -1 
})

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  
  // Auto-determine status based on risk score if not explicitly set
  if (this.isNew && this.status === 'SAFE') {
    if (this.riskScore >= 80) {
      this.status = 'FRAUD'
    } else if (this.riskScore >= 50) {
      this.status = 'SUSPICIOUS'
    }
  }
  
  next()
})

// Static methods
transactionSchema.statics.getStatusCounts = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgRiskScore: { $avg: '$riskScore' }
      }
    }
  ])
}

transactionSchema.statics.getRiskDistribution = async function() {
  return await this.aggregate([
    {
      $bucket: {
        groupBy: '$riskScore',
        boundaries: [0, 25, 50, 75, 100],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    }
  ])
}

transactionSchema.statics.getRecentTransactions = async function(limit = 10) {
  return await this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
}

// Instance methods
transactionSchema.methods.updateRiskScore = function(newScore) {
  this.riskScore = newScore
  
  // Update status based on new risk score
  if (newScore >= 80) {
    this.status = 'FRAUD'
  } else if (newScore >= 50) {
    this.status = 'SUSPICIOUS'
  } else {
    this.status = 'SAFE'
  }
  
  return this.save()
}

transactionSchema.methods.toSafeObject = function() {
  const obj = this.toObject()
  // Remove sensitive fields if needed
  delete obj.metadata?.sensitiveData
  return obj
}

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction