import { WebSocketServer } from 'ws'
import jwt from 'jsonwebtoken'
import logger from '../config/logger.js'

class WebSocketService {
  constructor() {
    this.wss = null
    this.clients = new Map()
    this.rooms = new Map()
  }

  initialize(server) {
    if (!process.env.WS_ENABLED || process.env.WS_ENABLED === 'false') {
      logger.info('WebSocket server disabled')
      return null
    }

    this.wss = new WebSocketServer({
      server,
      path: process.env.WS_PATH || '/ws',
      verifyClient: this.verifyClient.bind(this)
    })

    this.wss.on('connection', this.handleConnection.bind(this))
    this.setupHeartbeat()

    logger.info(`WebSocket server initialized on path ${process.env.WS_PATH || '/ws'}`)
    return this.wss
  }

  verifyClient(info) {
    try {
      // Extract token from query string or headers
      const url = new URL(info.req.url, `http://${info.req.headers.host}`)
      const token = url.searchParams.get('token') || 
                   info.req.headers.authorization?.replace('Bearer ', '')

      if (!token) {
        logger.warn('WebSocket connection rejected: No token provided')
        return false
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      info.req.user = decoded
      return true
    } catch (error) {
      logger.warn('WebSocket connection rejected: Invalid token', error.message)
      return false
    }
  }

  handleConnection(ws, req) {
    const clientId = this.generateClientId()
    const user = req.user

    // Store client information
    this.clients.set(clientId, {
      ws,
      user,
      subscriptions: new Set(),
      lastPing: Date.now(),
      isAlive: true
    })

    ws.clientId = clientId
    ws.isAlive = true

    logger.info(`WebSocket client connected: ${clientId} (User: ${user.id})`)

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connection',
      status: 'connected',
      clientId,
      timestamp: new Date().toISOString()
    })

    // Set up event handlers
    ws.on('message', (data) => this.handleMessage(clientId, data))
    ws.on('close', () => this.handleDisconnection(clientId))
    ws.on('error', (error) => this.handleError(clientId, error))
    ws.on('pong', () => this.handlePong(clientId))
  }

  handleMessage(clientId, data) {
    try {
      const client = this.clients.get(clientId)
      if (!client) return

      const message = JSON.parse(data.toString())
      logger.debug(`WebSocket message from ${clientId}:`, message.type)

      switch (message.type) {
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() })
          break

        case 'subscribe':
          this.handleSubscription(clientId, message.channels || [])
          break

        case 'unsubscribe':
          this.handleUnsubscription(clientId, message.channels || [])
          break

        case 'join_room':
          this.joinRoom(clientId, message.room)
          break

        case 'leave_room':
          this.leaveRoom(clientId, message.room)
          break

        default:
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Unknown message type',
            timestamp: new Date().toISOString()
          })
      }
    } catch (error) {
      logger.error(`Error handling WebSocket message from ${clientId}:`, error)
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      })
    }
  }

  handleSubscription(clientId, channels) {
    const client = this.clients.get(clientId)
    if (!client) return

    channels.forEach(channel => {
      client.subscriptions.add(channel)
    })

    this.sendToClient(clientId, {
      type: 'subscribed',
      channels,
      timestamp: new Date().toISOString()
    })

    logger.debug(`Client ${clientId} subscribed to channels:`, channels)
  }

  handleUnsubscription(clientId, channels) {
    const client = this.clients.get(clientId)
    if (!client) return

    channels.forEach(channel => {
      client.subscriptions.delete(channel)
    })

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      channels,
      timestamp: new Date().toISOString()
    })

    logger.debug(`Client ${clientId} unsubscribed from channels:`, channels)
  }

  joinRoom(clientId, roomName) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set())
    }

    this.rooms.get(roomName).add(clientId)
    
    this.sendToClient(clientId, {
      type: 'room_joined',
      room: roomName,
      timestamp: new Date().toISOString()
    })

    logger.debug(`Client ${clientId} joined room: ${roomName}`)
  }

  leaveRoom(clientId, roomName) {
    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName).delete(clientId)
      
      // Clean up empty rooms
      if (this.rooms.get(roomName).size === 0) {
        this.rooms.delete(roomName)
      }
    }

    this.sendToClient(clientId, {
      type: 'room_left',
      room: roomName,
      timestamp: new Date().toISOString()
    })

    logger.debug(`Client ${clientId} left room: ${roomName}`)
  }

  handleDisconnection(clientId) {
    // Remove from all rooms
    this.rooms.forEach((clients, roomName) => {
      if (clients.has(clientId)) {
        clients.delete(clientId)
        if (clients.size === 0) {
          this.rooms.delete(roomName)
        }
      }
    })

    // Remove client
    this.clients.delete(clientId)
    logger.info(`WebSocket client disconnected: ${clientId}`)
  }

  handleError(clientId, error) {
    logger.error(`WebSocket error for client ${clientId}:`, error)
  }

  handlePong(clientId) {
    const client = this.clients.get(clientId)
    if (client) {
      client.isAlive = true
      client.lastPing = Date.now()
    }
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId)
    if (client && client.ws.readyState === 1) { // WebSocket.OPEN
      try {
        client.ws.send(JSON.stringify(data))
        return true
      } catch (error) {
        logger.error(`Error sending message to client ${clientId}:`, error)
        return false
      }
    }
    return false
  }

  broadcast(data, channel = null) {
    let sentCount = 0
    
    this.clients.forEach((client, clientId) => {
      if (channel && !client.subscriptions.has(channel)) {
        return
      }

      if (this.sendToClient(clientId, data)) {
        sentCount++
      }
    })

    logger.debug(`Broadcast message sent to ${sentCount} clients`)
    return sentCount
  }

  broadcastToRoom(roomName, data) {
    const room = this.rooms.get(roomName)
    if (!room) return 0

    let sentCount = 0
    room.forEach(clientId => {
      if (this.sendToClient(clientId, data)) {
        sentCount++
      }
    })

    logger.debug(`Room broadcast sent to ${sentCount} clients in room ${roomName}`)
    return sentCount
  }

  setupHeartbeat() {
    const interval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          logger.debug(`Terminating inactive WebSocket client: ${clientId}`)
          client.ws.terminate()
          this.clients.delete(clientId)
          return
        }

        client.isAlive = false
        client.ws.ping()
      })
    }, 30000) // 30 seconds

    // Clear interval on process exit
    process.on('SIGTERM', () => clearInterval(interval))
    process.on('SIGINT', () => clearInterval(interval))
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      activeRooms: this.rooms.size,
      totalRoomMembers: Array.from(this.rooms.values()).reduce((sum, room) => sum + room.size, 0)
    }
  }

  close() {
    if (this.wss) {
      this.wss.close()
      logger.info('WebSocket server closed')
    }
  }
}

export default new WebSocketService()