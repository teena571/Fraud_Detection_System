import { Kafka } from 'kafkajs'
import logger from '../config/logger.js'

class KafkaProducer {
  constructor() {
    this.kafka = null
    this.producer = null
    this.isConnected = false
  }

  async connect() {
    try {
      this.kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'fraud-monitor-producer',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      })

      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000
      })

      await this.producer.connect()
      this.isConnected = true
      logger.info('Kafka producer connected')
    } catch (error) {
      logger.error('Kafka producer connection failed:', error)
      // Don't exit process, Kafka is optional
    }
  }

  async disconnect() {
    try {
      if (this.producer && this.isConnected) {
        await this.producer.disconnect()
        this.isConnected = false
        logger.info('Kafka producer disconnected')
      }
    } catch (error) {
      logger.error('Error disconnecting Kafka producer:', error)
    }
  }

  async sendMessage(topic, message, key = null) {
    try {
      if (!this.isConnected) {
        logger.warn('Kafka producer not connected, message not sent')
        return false
      }

      const payload = {
        topic,
        messages: [{
          key: key || null,
          value: JSON.stringify(message),
          timestamp: Date.now().toString()
        }]
      }

      await this.producer.send(payload)
      logger.debug(`Message sent to topic ${topic}`)
      return true
    } catch (error) {
      logger.error('Error sending Kafka message:', error)
      return false
    }
  }

  async sendBatch(topic, messages) {
    try {
      if (!this.isConnected) {
        logger.warn('Kafka producer not connected, batch not sent')
        return false
      }

      const formattedMessages = messages.map(msg => ({
        key: msg.key || null,
        value: JSON.stringify(msg.value),
        timestamp: Date.now().toString()
      }))

      await this.producer.send({
        topic,
        messages: formattedMessages
      })

      logger.debug(`Batch of ${messages.length} messages sent to topic ${topic}`)
      return true
    } catch (error) {
      logger.error('Error sending Kafka batch:', error)
      return false
    }
  }

  async sendTransactionEvent(transaction, eventType = 'created') {
    const topic = 'fraud-transactions'
    const message = {
      eventType,
      transaction,
      timestamp: new Date().toISOString(),
      source: 'fraud-monitor-backend'
    }

    return await this.sendMessage(topic, message, transaction.id)
  }

  async sendAlertEvent(alert) {
    const topic = 'fraud-alerts'
    const message = {
      ...alert,
      timestamp: new Date().toISOString(),
      source: 'fraud-monitor-backend'
    }

    return await this.sendMessage(topic, message, alert.id)
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', message: 'Not connected' }
      }
      
      // Simple health check by getting metadata
      const admin = this.kafka.admin()
      await admin.connect()
      await admin.listTopics()
      await admin.disconnect()
      
      return { status: 'healthy' }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}

export default new KafkaProducer()