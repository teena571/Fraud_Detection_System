import { Kafka } from 'kafkajs'
import logger from '../config/logger.js'

class KafkaConsumer {
  constructor() {
    this.kafka = null
    this.consumer = null
    this.isConnected = false
    this.messageHandlers = new Map()
  }

  async connect() {
    try {
      this.kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'fraud-monitor-consumer',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      })

      this.consumer = this.kafka.consumer({
        groupId: process.env.KAFKA_GROUP_ID || 'fraud-monitor-group',
        sessionTimeout: 30000,
        heartbeatInterval: 3000
      })

      await this.consumer.connect()
      this.isConnected = true
      logger.info('Kafka consumer connected')

      // Set up error handling
      this.consumer.on('consumer.crash', (error) => {
        logger.error('Kafka consumer crashed:', error)
        this.isConnected = false
      })

    } catch (error) {
      logger.error('Kafka consumer connection failed:', error)
      // Don't exit process, Kafka is optional
    }
  }

  async disconnect() {
    try {
      if (this.consumer && this.isConnected) {
        await this.consumer.disconnect()
        this.isConnected = false
        logger.info('Kafka consumer disconnected')
      }
    } catch (error) {
      logger.error('Error disconnecting Kafka consumer:', error)
    }
  }

  async subscribe(topics, handler) {
    try {
      if (!this.isConnected) {
        logger.warn('Kafka consumer not connected, cannot subscribe')
        return false
      }

      // Subscribe to topics
      for (const topic of topics) {
        await this.consumer.subscribe({ topic })
        this.messageHandlers.set(topic, handler)
        logger.info(`Subscribed to Kafka topic: ${topic}`)
      }

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const handler = this.messageHandlers.get(topic)
            if (handler) {
              const parsedMessage = {
                topic,
                partition,
                offset: message.offset,
                key: message.key?.toString(),
                value: JSON.parse(message.value.toString()),
                timestamp: message.timestamp
              }

              await handler(parsedMessage)
              logger.debug(`Processed message from topic ${topic}`)
            }
          } catch (error) {
            logger.error(`Error processing message from topic ${topic}:`, error)
          }
        }
      })

      return true
    } catch (error) {
      logger.error('Error subscribing to Kafka topics:', error)
      return false
    }
  }

  async subscribeToTransactionEvents(handler) {
    return await this.subscribe(['fraud-transactions'], handler)
  }

  async subscribeToAlertEvents(handler) {
    return await this.subscribe(['fraud-alerts'], handler)
  }

  // Default message handlers
  async handleTransactionMessage(message) {
    try {
      logger.info('Received transaction event:', {
        eventType: message.value.eventType,
        transactionId: message.value.transaction?.id
      })

      // Process transaction event
      // This could trigger additional fraud checks, notifications, etc.
      
    } catch (error) {
      logger.error('Error handling transaction message:', error)
    }
  }

  async handleAlertMessage(message) {
    try {
      logger.info('Received alert event:', {
        alertId: message.value.id,
        severity: message.value.severity
      })

      // Process alert event
      // This could trigger notifications, escalations, etc.
      
    } catch (error) {
      logger.error('Error handling alert message:', error)
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', message: 'Not connected' }
      }
      
      return { status: 'healthy' }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}

export default new KafkaConsumer()