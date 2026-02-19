import kafkaProducer from '../services/kafkaProducer.js'
import { TOPICS } from '../config/kafka.js'
import dotenv from 'dotenv'

dotenv.config()

// Configuration
const INTERVAL_MS = 2000 // Send transaction every 2 seconds
const FRAUD_PROBABILITY = 0.15 // 15% chance of fraud pattern

// Sample data
const USERS = [
  'user_001', 'user_002', 'user_003', 'user_004', 'user_005',
  'user_006', 'user_007', 'user_008', 'user_009', 'user_010',
  'user_suspicious_001', 'user_suspicious_002', 'user_fraud_001'
]

const PAYMENT_METHODS = [
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'DIGITAL_WALLET',
  'OTHER'
]

const COUNTRIES = [
  'USA', 'UK', 'Canada', 'Germany', 'France',
  'Japan', 'Australia', 'Brazil', 'India', 'China'
]

const CITIES = {
  'USA': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
  'UK': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice']
}

const MERCHANTS = [
  'Amazon', 'Walmart', 'Target', 'Best Buy', 'Apple Store',
  'Nike', 'Adidas', 'Starbucks', 'McDonalds', 'Uber',
  'Netflix', 'Spotify', 'Steam', 'PlayStation', 'Xbox'
]

const DESCRIPTIONS = [
  'Online purchase',
  'In-store purchase',
  'Subscription payment',
  'Bill payment',
  'Money transfer',
  'ATM withdrawal',
  'Restaurant payment',
  'Gas station',
  'Grocery shopping',
  'Entertainment'
]

// Statistics
let stats = {
  totalSent: 0,
  fraudPatterns: 0,
  normalTransactions: 0,
  highAmount: 0,
  lowAmount: 0,
  errors: 0
}

// Helper functions
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min
  return parseFloat(value.toFixed(decimals))
}

function generateTransactionId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9).toUpperCase()
  return `TXN_${timestamp}_${random}`
}

function generateIPAddress() {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`
}

function isFraudPattern() {
  return Math.random() < FRAUD_PROBABILITY
}

function generateNormalTransaction() {
  const country = randomElement(COUNTRIES)
  const cities = CITIES[country] || ['Unknown City']
  
  return {
    transactionId: generateTransactionId(),
    userId: randomElement(USERS.slice(0, 10)), // Normal users
    amount: randomFloat(10, 5000),
    timestamp: new Date().toISOString(),
    description: randomElement(DESCRIPTIONS),
    merchantId: `merchant_${randomInt(1000, 9999)}`,
    merchantName: randomElement(MERCHANTS),
    paymentMethod: randomElement(PAYMENT_METHODS.slice(0, 4)), // Exclude 'OTHER'
    location: {
      country,
      city: randomElement(cities),
      ipAddress: generateIPAddress()
    },
    metadata: {
      deviceType: randomElement(['mobile', 'desktop', 'tablet']),
      browser: randomElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
      sessionId: `session_${randomInt(10000, 99999)}`
    }
  }
}

function generateFraudTransaction() {
  const fraudType = randomInt(1, 5)
  const country = randomElement(COUNTRIES)
  const cities = CITIES[country] || ['Unknown City']
  
  let transaction = {
    transactionId: generateTransactionId(),
    userId: randomElement(['user_suspicious_001', 'user_suspicious_002', 'user_fraud_001']),
    timestamp: new Date().toISOString(),
    description: randomElement(DESCRIPTIONS),
    merchantId: `merchant_${randomInt(1000, 9999)}`,
    merchantName: randomElement(MERCHANTS),
    location: {
      country,
      city: randomElement(cities),
      ipAddress: generateIPAddress()
    },
    metadata: {
      deviceType: randomElement(['mobile', 'desktop', 'tablet']),
      browser: randomElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
      sessionId: `session_${randomInt(10000, 99999)}`,
      fraudPattern: ''
    }
  }

  switch (fraudType) {
    case 1: // High amount transaction
      transaction.amount = randomFloat(50000, 200000)
      transaction.paymentMethod = randomElement(['DIGITAL_WALLET', 'BANK_TRANSFER'])
      transaction.metadata.fraudPattern = 'high_amount'
      stats.highAmount++
      break

    case 2: // Multiple rapid transactions
      transaction.amount = randomFloat(5000, 15000)
      transaction.paymentMethod = 'CREDIT_CARD'
      transaction.metadata.fraudPattern = 'rapid_transactions'
      transaction.metadata.transactionCount = randomInt(5, 15)
      break

    case 3: // Unusual payment method
      transaction.amount = randomFloat(10000, 50000)
      transaction.paymentMethod = 'OTHER'
      transaction.metadata.fraudPattern = 'unusual_payment'
      break

    case 4: // Late night transaction
      const lateNightHour = randomInt(0, 5)
      const lateNightDate = new Date()
      lateNightDate.setHours(lateNightHour, randomInt(0, 59), randomInt(0, 59))
      transaction.timestamp = lateNightDate.toISOString()
      transaction.amount = randomFloat(5000, 25000)
      transaction.paymentMethod = randomElement(PAYMENT_METHODS)
      transaction.metadata.fraudPattern = 'late_night'
      break

    case 5: // High-risk location + high amount
      transaction.amount = randomFloat(25000, 100000)
      transaction.paymentMethod = 'DIGITAL_WALLET'
      transaction.location.country = 'Unknown'
      transaction.location.city = 'Unknown'
      transaction.metadata.fraudPattern = 'high_risk_location'
      break
  }

  stats.fraudPatterns++
  return transaction
}

function generateTransaction() {
  if (isFraudPattern()) {
    return generateFraudTransaction()
  } else {
    stats.normalTransactions++
    return generateNormalTransaction()
  }
}

async function sendTransaction() {
  try {
    const transaction = generateTransaction()
    
    // Create message for Kafka
    const message = {
      eventType: 'transaction.created',
      transaction,
      timestamp: new Date().toISOString(),
      source: 'kafka-test-producer'
    }

    // Send to Kafka
    const success = await kafkaProducer.sendMessage(
      TOPICS.TRANSACTIONS,
      message,
      transaction.transactionId
    )

    if (success) {
      stats.totalSent++
      
      // Log transaction details
      const fraudIndicator = transaction.metadata?.fraudPattern ? '🚨 FRAUD' : '✅ NORMAL'
      console.log(`${fraudIndicator} | ${transaction.transactionId} | $${transaction.amount.toFixed(2)} | ${transaction.userId}`)
      
      if (transaction.metadata?.fraudPattern) {
        console.log(`   └─ Pattern: ${transaction.metadata.fraudPattern}`)
      }
    } else {
      stats.errors++
      console.error('❌ Failed to send transaction')
    }

  } catch (error) {
    stats.errors++
    console.error('❌ Error generating/sending transaction:', error.message)
  }
}

function printStats() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 KAFKA TEST PRODUCER STATISTICS')
  console.log('='.repeat(60))
  console.log(`Total Sent:           ${stats.totalSent}`)
  console.log(`Normal Transactions:  ${stats.normalTransactions} (${((stats.normalTransactions/stats.totalSent)*100).toFixed(1)}%)`)
  console.log(`Fraud Patterns:       ${stats.fraudPatterns} (${((stats.fraudPatterns/stats.totalSent)*100).toFixed(1)}%)`)
  console.log(`  - High Amount:      ${stats.highAmount}`)
  console.log(`Errors:               ${stats.errors}`)
  console.log('='.repeat(60) + '\n')
}

function printBanner() {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 KAFKA TEST PRODUCER STARTED')
  console.log('='.repeat(60))
  console.log(`Interval:             ${INTERVAL_MS}ms (${INTERVAL_MS/1000}s)`)
  console.log(`Fraud Probability:    ${(FRAUD_PROBABILITY * 100).toFixed(0)}%`)
  console.log(`Kafka Topic:          ${TOPICS.TRANSACTIONS}`)
  console.log(`Kafka Brokers:        ${process.env.KAFKA_BROKERS || 'localhost:9092'}`)
  console.log('='.repeat(60))
  console.log('Press Ctrl+C to stop\n')
}

async function start() {
  try {
    console.log('🔄 Connecting to Kafka...')
    
    // Connect to Kafka
    await kafkaProducer.connect()
    
    console.log('✅ Connected to Kafka')
    
    printBanner()
    
    // Send first transaction immediately
    await sendTransaction()
    
    // Set up interval to send transactions
    const interval = setInterval(async () => {
      await sendTransaction()
      
      // Print stats every 10 transactions
      if (stats.totalSent % 10 === 0) {
        printStats()
      }
    }, INTERVAL_MS)

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Stopping producer...')
      clearInterval(interval)
      
      printStats()
      
      await kafkaProducer.disconnect()
      console.log('✅ Disconnected from Kafka')
      console.log('👋 Goodbye!\n')
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('\n\n🛑 Stopping producer...')
      clearInterval(interval)
      
      printStats()
      
      await kafkaProducer.disconnect()
      console.log('✅ Disconnected from Kafka')
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ Failed to start producer:', error.message)
    process.exit(1)
  }
}

// Start the producer
start()