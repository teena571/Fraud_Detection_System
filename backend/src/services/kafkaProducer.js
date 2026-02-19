import kafka, { TOPICS } from '../config/kafka.js'

class KafkaProducer {
  constructor() {
    this.producer = null
    this.isConnected = false
  }

  async connect() {
    try {
      this.producer = kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000,
        idempotent: true,
        maxInFlightRequests: 5,
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      })

      await this.producer.connect()
      this.isConnected = true
      console.log('✅ Kafka Producer connected')

      // Handle producer events
      this.producer.on('producer.disconnect', () => {
        console.log('⚠️ Kafka Producer disconnected')
        this.isConnected = false
      })

      this.producer.on('producer.network.request_timeout', (payload) => {
        console.error('❌ Kafka Producer request timeout:', payload)
      })

    } catch (error) {
      console.error('❌ Failed to connect Kafka Producer:', error.message)
      this.isConnected = false
      throw error
    }
  }

  async disconnect() {
    try {
      if (this.producer && this.isConnected) {
        await this.producer.disconnect()
        this.isConnected = false
        console.log('✅ Kafka Producer disconnected')
      }
    } catch (error) {
      console.error('❌ Error disconnecting Kafka Producer:', error.message)
    }
  }

  async sendMessage(topic, message, key = null) {
    if (!this.isConnected) {
      console.warn('⚠️ Kafka Producer not connected, message not sent')
      return false
    }

    try {
      const payload = {
        topic,
        messages: [{
          key: key || null,
          value: JSON.stringify(message),
          timestamp: Date.now().toString(),
          headers: {
            'content-type': 'application/json',
            'source': 'fraudshield-backend',
            'timestamp': Date.now().toString()
          }
        }]
      }

      const result = await this.producer.send(payload)
      
      console.log(`📤 Message sent to topic '${topic}':`, {
        partition: result[0].partition,
        offset: result[0].offset
      })

      return true
    } catch (error) {
      console.error(`❌ Error sending message to topic '${topic}':`, error.message)
      return false
    }
  }

  async sendBatch(topic, messages) {
    if (!this.isConnected) {
      console.warn('⚠️ Kafka Producer not connected, batch not sent')
      return false
    }

    try {
      const formattedMessages = messages.map(msg => ({
        key: msg.key || null,
        value: JSON.stringify(msg.value),
        timestamp: Date.now().toString(),
        headers: {
          'content-type': 'application/json',
          'source': 'fraudshield-backend',
          'timestamp': Date.now().toString()
        }
      }))

      const result = await this.producer.send({
        topic,
        messages: formattedMessages
      })

      console.log(`📤 Batch of ${messages.length} messages sent to topic '${topic}'`)
      return true
    } catch (error) {
      console.error(`❌ Error sending batch to topic '${topic}':`, error.message)
      return false
    }
  }

  // Send transaction to Kafka
  async sendTransaction(transaction) {
    const message = {
      eventType: 'transaction.created',
      transaction: {
        transactionId: transaction.transactionId,
        userId: transaction.userId,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        status: transaction.status,
        riskScore: transaction.riskScore,
        description: transaction.description,
        merchantId: transaction.merchantId,
        paymentMethod: transaction.paymentMethod,
        location: transaction.location,
        metadata: transaction.metadata
      },
      timestamp: new Date().toISOString(),
      source: 'fraudshield-backend'
    }

    return await this.sendMessage(
      TOPICS.TRANSACTIONS,
      message,
      transaction.transactionId
    )
  }

  // Send transaction update to Kafka
  async sendTransactionUpdate(transaction) {
    const message = {
      eventType: 'transaction.updated',
      transaction: {
        transactionId: transaction.transactionId,
        userId: transaction.userId,
        amount: transaction.amount,
        status: transaction.status,
        riskScore: transaction.riskScore
      },
      timestamp: new Date().toISOString(),
      source: 'fraudshield-backend'
    }

    return await this.sendMessage(
      TOPICS.TRANSACTION_EVENTS,
      message,
      transaction.transactionId
    )
  }

  // Send alert to Kafka
  async sendAlert(alert) {
    const message = {
      eventType: 'alert.created',
      alert: {
        id: alert.id,
        transactionId: alert.transactionId,
        message: alert.message,
        severity: alert.severity,
        transactionAmount: alert.transactionAmount,
        transactionRiskScore: alert.transactionRiskScore,
        userId: alert.userId,
        status: alert.status,
        createdAt: alert.createdAt
      },
      timestamp: new Date().toISOString(),
      source: 'fraudshield-backend'
    }

    return await this.sendMessage(
      TOPICS.ALERTS,
      message,
      alert.transactionId
    )
  }

  // Send alert update to Kafka
  async sendAlertUpdate(alert, action) {
    const message = {
      eventType: `alert.${action}`,
      alert: {
        id: alert.id,
        transactionId: alert.transactionId,
        status: alert.status,
        severity: alert.severity
      },
      action,
      timestamp: new Date().toISOString(),
      source: 'fraudshield-backend'
    }

    return await this.sendMessage(
      TOPICS.ALERTS,
      message,
      alert.transactionId
    )
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', message: 'Not connected' }
      }

      // Try to get metadata to verify connection
      const admin = kafka.admin()
      await admin.connect()
      await admin.listTopics()
      await admin.disconnect()

      return { status: 'healthy', connected: true }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}

// Create singleton instance
const kafkaProducer = new KafkaProducer()

export default kafkaProducer