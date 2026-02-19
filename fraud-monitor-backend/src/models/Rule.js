import mongoose from 'mongoose'

const ruleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  conditions: [{
    field: {
      type: String,
      required: true,
      enum: ['amount', 'riskScore', 'userId', 'merchantId', 'paymentMethod', 'location.country', 'deviceInfo.ipAddress']
    },
    operator: {
      type: String,
      required: true,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'contains', 'not_contains', 'in', 'not_in']
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }],
  actions: [{
    type: {
      type: String,
      required: true,
      enum: ['flag', 'block', 'review', 'alert', 'score_adjustment']
    },
    parameters: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  }],
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: String,
  executionCount: {
    type: Number,
    default: 0
  },
  lastExecuted: Date
}, {
  timestamps: true
})

// Indexes
ruleSchema.index({ isActive: 1, priority: -1 })
ruleSchema.index({ createdBy: 1 })

// Static methods
ruleSchema.statics.getActiveRules = function() {
  return this.find({ isActive: true }).sort({ priority: -1, createdAt: 1 })
}

ruleSchema.statics.evaluateTransaction = async function(transaction) {
  const rules = await this.getActiveRules()
  const results = []
  
  for (const rule of rules) {
    const result = rule.evaluate(transaction)
    if (result.matched) {
      results.push({
        ruleId: rule._id,
        ruleName: rule.name,
        actions: result.actions
      })
      
      // Update execution count
      rule.executionCount += 1
      rule.lastExecuted = new Date()
      await rule.save()
    }
  }
  
  return results
}

// Instance methods
ruleSchema.methods.evaluate = function(transaction) {
  // Check if all conditions are met
  const conditionsMet = this.conditions.every(condition => {
    return this.evaluateCondition(condition, transaction)
  })
  
  return {
    matched: conditionsMet,
    actions: conditionsMet ? this.actions : []
  }
}

ruleSchema.methods.evaluateCondition = function(condition, transaction) {
  const fieldValue = this.getFieldValue(condition.field, transaction)
  const conditionValue = condition.value
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === conditionValue
    case 'not_equals':
      return fieldValue !== conditionValue
    case 'greater_than':
      return Number(fieldValue) > Number(conditionValue)
    case 'less_than':
      return Number(fieldValue) < Number(conditionValue)
    case 'greater_equal':
      return Number(fieldValue) >= Number(conditionValue)
    case 'less_equal':
      return Number(fieldValue) <= Number(conditionValue)
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase())
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase())
    case 'in':
      return Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
    case 'not_in':
      return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue)
    default:
      return false
  }
}

ruleSchema.methods.getFieldValue = function(fieldPath, transaction) {
  const keys = fieldPath.split('.')
  let value = transaction
  
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key]
    } else {
      return undefined
    }
  }
  
  return value
}

const Rule = mongoose.model('Rule', ruleSchema)

export default Rule