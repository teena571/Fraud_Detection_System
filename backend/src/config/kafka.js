import { Kafka, logLevel } from 'kafkajs'
import dotenv from 'dotenv'

dotenv.config()

// Kafka configuration
const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'fraudshield-backend',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT) || 10000,
  requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT) || 30000,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    multiplier: 2,
    factor: 0.2
  },
  logLevel: process.env.NODE_ENV === 'production' ? logLevel.ERROR : logLevel.INFO
}

// Create Kafka instance
const kafka = new Kafka(kafkaConfig)

// Topic configurations
export const TOPICS = {
  TRANSACTIONS: process.env.KAFKA_TOPIC_TRANSACTIONS || 'transactions',
  ALERTS: process.env.KAFKA_TOPIC_ALERTS || 'alerts',
  TRANSACTION_EVENTS: process.env.KAFKA_TOPIC_TRANSACTION_EVENTS || 'transaction-events'
}

// Consumer group IDs
export const CONSUMER_GROUPS = {
  TRANSACTION_PROCESSOR: process.env.KAFKA_GROUP_TRANSACTION_PROCESSOR || 'transaction-processor-group',
  ALERT_PROCESSOR: process.env.KAFKA_GROUP_ALERT_PROCESSOR || 'alert-processor-group'
}

// Create topics if they don't exist
export const createTopics = async () => {
  const admin = kafka.admin()
  
  try {
    await admin.connect()
    console.log('📡 Kafka admin connected')
    
    const existingTopics = await admin.listTopics()
    const topicsToCreate = []
    
    // Check which topics need to be created
    Object.values(TOPICS).forEach(topic => {
      if (!existingTopics.includes(topic)) {
        topicsToCreate.push({
          topic,
          numPartitions: parseInt(process.env.KAFKA_NUM_PARTITIONS) || 3,
          replicationFactor: parseInt(process.env.KAFKA_REPLICATION_FACTOR) || 1,
          configEntries: [
            { name: 'retention.ms', value: '604800000' }, // 7 days
            { name: 'cleanup.policy', value: 'delete' }
          ]
        })
      }
    })
    
    if (topicsToCreate.length > 0) {
      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true
      })
      console.log(`✅ Created Kafka topics: ${topicsToCreate.map(t => t.topic).join(', ')}`)
    } else {
      console.log('✅ All Kafka topics already exist')
    }
    
    await admin.disconnect()
  } catch (error) {
    console.error('❌ Failed to create Kafka topics:', error.message)
    await admin.disconnect()
    throw error
  }
}

// Health check
export const checkKafkaHealth = async () => {
  const admin = kafka.admin()
  
  try {
    await admin.connect()
    const cluster = await admin.describeCluster()
    await admin.disconnect()
    
    return {
      status: 'healthy',
      brokers: cluster.brokers.length,
      controller: cluster.controller
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

export default kafka