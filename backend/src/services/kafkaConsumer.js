import kafka, { TOPICS, CONSUMER_GROUPS } from '../config/kafka.js'
import Transaction from '../models/Transaction.js'
import Alert from '../models/Alert.js'

class KafkaConsumer {
  constructor() {
    this.consumer = null
    this.isConnected = false
    this.isRunning = false
    this.wss = null // WebSocket server reference
  }

  setWebSocketServer(wss) {
    this.wss = wss
  }

  async connect() {
    try {
      this.consumer = kafka.consumer({
        groupId: CONSUMER_GROUPS.TRANSACTION_PROCESSOR,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxWaitTimeInMs: 5000,
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      })

      await this.consumer.connect()
      this.isConnected = true
      console.log('✅ Kafka Consumer connected')

      // Handle consumer events
      this.consumer.on('consumer.disconnect', () => {
        console.log('⚠️ Kafka Consumer disconnected')
        this.isConnected = false
        this.isRunning = false
      })

      this.consumer.on('consumer.crash', (error) => {
        console.error('❌ Kafka Consumer crashed:', error.payload.error)
        this.isConnected = false
        this.isRunning = false
      })

    } catch (error) {
      console.error('❌ Failed to connect Kafka Consumer:', error.message)
      this.isConnected = false
      throw error
    }
  }

  async disconnect() {
    try {
      if (this.consumer && this.isConnected) {
        await this.consumer.disconnect()
        this.isConnected = false
        this.isRunning = false
        console.log('✅ Kafka Consumer disconnected')
      }
    } catch (error) {
      console.error('❌ Error disconnecting Kafka Consumer:', error.message)
    }
  }

  async subscribe() {
    if (!this.isConnected) {
      throw new Error('Consumer not connected')
    }

    try {
      // Subscribe to topics
      await this.consumer.subscribe({
        topics: [TOPICS.TRANSACTIONS, TOPICS.ALERTS],
        fromBeginning: false
      })

      console.log(`✅ Subscribed to topics: ${TOPICS.TRANSACTIONS}, ${TOPICS.ALERTS}`)
    } catch (error) {
      console.error('❌ Failed to subscribe to topics:', error.message)
      throw error
    }
  }

  async start() {
    if (!this.isConnected) {
      throw new Error('Consumer not connected')
    }

    if (this.isRunning) {
      console.log('⚠️ Consumer already running')
      return
    }

    try {
      this.isRunning = true

      await this.consumer.run({
        autoCommit: true,
        autoCommitInterval: 5000,
        eachMessage: async ({ topic, partition, message }) => {
          try {
            await this.handleMessage(topic, partition, message)
          } catch (error) {
            console.error(`❌ Error processing message from topic '${topic}':`, error.message)
            // Don't throw - continue processing other messages
          }
        }
      })

      console.log('✅ Kafka Consumer started and listening for messages')
    } catch (error) {
      console.error('❌ Failed to start Kafka Consumer:', error.message)
      this.isRunning = false
      throw error
    }
  }

  async handleMessage(topic, partition, message) {
    const key = message.key?.toString()
    const value = JSON.parse(message.value.toString())
    const offset = message.offset

    console.log(`📥 Received message from topic '${topic}' [partition: ${partition}, offset: ${offset}]`)

    switch (topic) {
      case TOPICS.TRANSACTIONS:
        await this.handleTransactionMessage(value)
        break
      case TOPICS.ALERTS:
        await this.handleAlertMessage(value)
        break
      default:
        console.log(`⚠️ Unknown topic: ${topic}`)
    }
  }

  async handleTransactionMessage(data) {
    try {
      const { eventType, transaction } = data

      console.log(`🔄 Processing transaction event: ${eventType}`)

      if (eventType === 'transaction.created') {
        // Calculate risk score if not provided
        let riskScore = transaction.riskScore || 0

        if (!transaction.riskScore) {
          riskScore = this.calculateRiskScore(transaction)
          console.log(`📊 Calculated risk score: ${riskScore}`)
        }

        // Determine status based on risk score
        let status = transaction.status || 'SAFE'
        if (riskScore >= 80) {
          status = 'FRAUD'
        } else if (riskScore >= 50) {
          status = 'SUSPICIOUS'
        }

        // Check if transaction already exists
        const existingTransaction = await Transaction.findOne({
          transactionId: transaction.transactionId
        })

        if (existingTransaction) {
          console.log(`⚠️ Transaction ${transaction.transactionId} already exists, skipping`)
          return
        }

        // Save transaction to database
        const newTransaction = new Transaction({
          transactionId: transaction.transactionId,
          userId: transaction.userId,
          amount: transaction.amount,
          timestamp: transaction.timestamp || new Date(),
          status,
          riskScore,
          description: transaction.description,
          merchantId: transaction.merchantId,
          paymentMethod: transaction.paymentMethod,
          location: transaction.location,
          metadata: transaction.metadata,
          createdBy: 'kafka-consumer'
        })

        const savedTransaction = await newTransaction.save()
        console.log(`✅ Transaction saved to DB: ${savedTransaction.transactionId}`)

        // Create alert if suspicious (riskScore > 70 OR amount > 50000)
        if (riskScore > 70 || transaction.amount > 50000) {
          const alerts = await Alert.createFromTransaction(savedTransaction.toObject())
          
          if (alerts.length > 0) {
            console.log(`🚨 Alert created for transaction ${savedTransaction.transactionId}`)
            
            // Emit alert via WebSocket
            if (this.wss) {
              this.broadcastWebSocket({
                type: 'alert_created',
                payload: alerts[0]
              })
            }
          }
        }

        // Emit transaction via WebSocket
        if (this.wss) {
          this.broadcastWebSocket({
            type: 'transaction',
            payload: savedTransaction.toSafeObject()
          })
        }

      } else if (eventType === 'transaction.updated') {
        console.log(`🔄 Transaction update event: ${transaction.transactionId}`)
        // Handle transaction updates if needed
      }

    } catch (error) {
      console.error('❌ Error handling transaction message:', error.message)
      throw error
    }
  }

  async handleAlertMessage(data) {
    try {
      const { eventType, alert } = data

      console.log(`🔄 Processing alert event: ${eventType}`)

      if (eventType === 'alert.created') {
        console.log(`🚨 Alert created: ${alert.transactionId} - ${alert.severity}`)
        
        // Emit via WebSocket
        if (this.wss) {
          this.broadcastWebSocket({
            type: 'alert_created',
            payload: alert
          })
        }
      } else if (eventType.startsWith('alert.')) {
        console.log(`🔄 Alert ${data.action}: ${alert.transactionId}`)
        
        // Emit via WebSocket
        if (this.wss) {
          this.broadcastWebSocket({
            type: `alert_${data.action}`,
            payload: alert
          })
        }
      }

    } catch (error) {
      console.error('❌ Error handling alert message:', error.message)
      throw error
    }
  }

  // Calculate risk score based on transaction data
  calculateRiskScore(transaction) {
    let score = 0

    // Amount-based risk
    if (transaction.amount > 100000) {
      score += 40
    } else if (transaction.amount > 50000) {
      score += 30
    } else if (transaction.amount > 10000) {
      score += 20
    } else if (transaction.amount > 5000) {
      score += 10
    }

    // Payment method risk
    const riskByPaymentMethod = {
      'DIGITAL_WALLET': 15,
      'BANK_TRANSFER': 10,
      'CREDIT_CARD': 5,
      'DEBIT_CARD': 5,
      'OTHER': 20
    }
    score += riskByPaymentMethod[transaction.paymentMethod] || 10

    // Location risk (if available)
    if (transaction.location) {
      const highRiskCountries = ['XX', 'YY', 'ZZ'] // Example high-risk countries
      if (highRiskCountries.includes(transaction.location.country)) {
        score += 25
      }
    }

    // Time-based risk (transactions at odd hours)
    const hour = new Date(transaction.timestamp).getHours()
    if (hour >= 0 && hour < 6) {
      score += 15 // Late night transactions
    }

    // Random factor for demonstration (remove in production)
    score += Math.floor(Math.random() * 10)

    // Ensure score is between 0 and 100
    return Math.min(100, Math.max(0, score))
  }

  // Broadcast message to all WebSocket clients
  broadcastWebSocket(data) {
    if (!this.wss) return

    const message = JSON.stringify(data)
    let sentCount = 0

    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(message)
          sentCount++
        } catch (error) {
          console.error('❌ Error sending WebSocket message:', error.message)
        }
      }
    })

    if (sentCount > 0) {
      console.log(`📡 WebSocket broadcast sent to ${sentCount} clients`)
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', message: 'Not connected' }
      }

      if (!this.isRunning) {
        return { status: 'unhealthy', message: 'Not running' }
      }

      return { status: 'healthy', connected: true, running: true }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}

// Create singleton instance
const kafkaConsumer = new KafkaConsumer()

export default kafkaConsumer