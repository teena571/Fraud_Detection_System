import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Transaction from '../models/Transaction.js'
import { generateMockTransaction } from '../utils/helpers.js'

dotenv.config()

const seedTransactions = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudshield')
    console.log('Connected to MongoDB')

    // Clear existing transactions
    await Transaction.deleteMany({})
    console.log('Cleared existing transactions')

    // Generate sample transactions
    const transactions = []
    const count = 100 // Generate 100 sample transactions

    for (let i = 0; i < count; i++) {
      const mockTransaction = generateMockTransaction()
      
      // Add some variation to timestamps (spread over last 7 days)
      const daysAgo = Math.floor(Math.random() * 7)
      const hoursAgo = Math.floor(Math.random() * 24)
      const minutesAgo = Math.floor(Math.random() * 60)
      
      mockTransaction.timestamp = new Date(
        Date.now() - (daysAgo * 24 * 60 * 60 * 1000) - 
        (hoursAgo * 60 * 60 * 1000) - 
        (minutesAgo * 60 * 1000)
      )

      transactions.push(mockTransaction)
    }

    // Insert transactions
    const result = await Transaction.insertMany(transactions)
    console.log(`✅ Successfully seeded ${result.length} transactions`)

    // Display statistics
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgRiskScore: { $avg: '$riskScore' }
        }
      }
    ])

    console.log('\n📊 Seeded Data Statistics:')
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} transactions, Total: $${stat.totalAmount.toFixed(2)}, Avg Risk: ${stat.avgRiskScore.toFixed(1)}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('Error seeding data:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTransactions()
}

export default seedTransactions