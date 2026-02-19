import { WebSocketServer } from 'ws'
import { generateMockTransaction } from '../utils/helpers.js'

class WebSocketService {
  constructor() {
    this.wss = null
    this.clients = new Set()
    this.mockDataInterval = null
  }

  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/transactions'
    })

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established')
      this.clients.add(ws)

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to FraudShield WebSocket',
        timestamp: new Date().toISOString()
      }))

      // Handle client messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleClientMessage(ws, message)
        } catch (error) {
          console.error('Invalid WebSocket message:', error)
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }))
        }
      })

      // Handle client disconnect
      ws.on('close', () => {
        console.log('WebSocket connection closed')
        this.clients.delete(ws)
      })

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        this.clients.delete(ws)
      })
    })

    // Start mock data generation in development
    if (process.env.NODE_ENV === 'development') {
      this.startMockDataGeneration()
    }

    console.log('WebSocket server initialized')
    return this.wss
  }

  handleClientMessage(ws, message) {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }))
        break

      case 'subscribe':
        // Handle subscription to specific data types
        ws.subscriptions = message.channels || ['transactions']
        ws.send(JSON.stringify({
          type: 'subscribed',
          channels: ws.subscriptions
        }))
        break

      case 'unsubscribe':
        ws.subscriptions = []
        ws.send(JSON.stringify({
          type: 'unsubscribed'
        }))
        break

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }))
    }
  }

  broadcast(data) {
    const message = JSON.stringify(data)
    
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(message)
        } catch (error) {
          console.error('Error sending WebSocket message:', error)
          this.clients.delete(client)
        }
      }
    })
  }

  broadcastTransaction(transaction) {
    this.broadcast({
      type: 'transaction',
      payload: transaction,
      timestamp: new Date().toISOString()
    })
  }

  broadcastTransactionUpdate(transaction) {
    this.broadcast({
      type: 'transaction_update',
      payload: transaction,
      timestamp: new Date().toISOString()
    })
  }

  broadcastAlert(alert) {
    this.broadcast({
      type: 'alert',
      payload: alert,
      timestamp: new Date().toISOString()
    })
  }

  startMockDataGeneration() {
    // Generate mock transactions every 3-8 seconds
    this.mockDataInterval = setInterval(() => {
      if (this.clients.size > 0) {
        const mockTransaction = generateMockTransaction()
        this.broadcastTransaction(mockTransaction)

        // Occasionally send alerts for high-risk transactions
        if (mockTransaction.riskScore >= 70) {
          setTimeout(() => {
            this.broadcastAlert({
              id: `alert_${Date.now()}`,
              transactionId: mockTransaction.transactionId,
              type: mockTransaction.status,
              message: `${mockTransaction.status} transaction detected`,
              riskScore: mockTransaction.riskScore,
              amount: mockTransaction.amount,
              userId: mockTransaction.userId,
              timestamp: new Date().toISOString()
            })
          }, 1000)
        }
      }
    }, Math.random() * 5000 + 3000) // 3-8 seconds

    console.log('Mock data generation started')
  }

  stopMockDataGeneration() {
    if (this.mockDataInterval) {
      clearInterval(this.mockDataInterval)
      this.mockDataInterval = null
      console.log('Mock data generation stopped')
    }
  }

  getConnectionCount() {
    return this.clients.size
  }

  isInitialized() {
    return this.wss !== null
  }

  close() {
    this.stopMockDataGeneration()
    
    if (this.wss) {
      this.wss.close()
      console.log('WebSocket server closed')
    }
  }
}

export default new WebSocketService()