import { SigmaSocketServer, type ClientSession } from 'sigmasockets-server'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as flatbuffers from 'flatbuffers'
import { Message } from './generated/sigma-sockets/message.js'
import { MessageType } from './generated/sigma-sockets/message-type.js'
import { DataMessage } from './generated/sigma-sockets/data-message.js'

interface ChatMessage {
  type: 'chat'
  username: string
  timestamp: number
  data: {
    message: string
  }
}

interface ColorMessage {
  type: 'color'
  username: string
  timestamp: number
  data: {
    color: string
    message: string
  }
}

type StructuredMessage = ChatMessage | ColorMessage

interface UserCountMessage {
  type: 'userCount'
  count: number
}

class ChatServer {
  private wsServer: SigmaSocketServer
  private connectedUsers: Set<string> = new Set()
  private port: number

  constructor() {
    // Use Render.com default port (10000) or PORT environment variable
    this.port = parseInt(process.env['PORT'] || '10000')
    
    console.log(`🔧 Port configuration: HTTP=${this.port}, WebSocket=${this.port}`)
    console.log(`🔧 Environment: PORT=${process.env['PORT']}, SIGMASOCKETS_WS_PORT=${process.env['SIGMASOCKETS_WS_PORT']}`)
    console.log(`🔧 Render.com assigned port: ${process.env['PORT'] || 'NOT SET (using default 10000)'}`)
    console.log(`🔧 Final port being used: ${this.port}`)
    console.log('Creating SigmaSocketServer...')
    try {
      this.wsServer = new SigmaSocketServer({
        port: this.port,
        host: '0.0.0.0', // Must bind to 0.0.0.0 for Render.com HTTP requests
        heartbeatInterval: parseInt(process.env['SIGMASOCKETS_HEARTBEAT_INTERVAL'] || '30000'),
        sessionTimeout: parseInt(process.env['SIGMASOCKETS_SESSION_TIMEOUT'] || '300000'),
        maxConnections: parseInt(process.env['SIGMASOCKETS_MAX_CONNECTIONS'] || '1000'),
        requestHandler: this.handleHttpRequest.bind(this)
      })
      console.log('SigmaSocketServer created successfully')
    } catch (error) {
      console.error('Failed to create SigmaSocketServer:', error)
      throw error
    }

    this.setupEventHandlers()
  }

  private handleHttpRequest(req: any, res: any) {
      const url = req.url || '/'
      
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', process.env['SIGMASOCKETS_CORS_ORIGIN'] || '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }

      if (url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          connectedUsers: this.connectedUsers.size,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        }))
        return
      }

      if (url === '/') {
        try {
          const indexPath = join(process.cwd(), 'dist/client', 'index.html')
          const html = readFileSync(indexPath, 'utf8')
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(html)
        } catch (error) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Chat demo not found')
        }
        return
      }

      // Serve favicon and other static files
      if (url === '/favicon.ico' || url === '/site.webmanifest' || url.startsWith('/assets/') || url.startsWith('/images/')) {
        try {
          // Remove query parameters for file path resolution
          const cleanUrl = url.split('?')[0]
          const assetPath = join(process.cwd(), 'dist/client', cleanUrl)
          const asset = readFileSync(assetPath)
          const ext = cleanUrl.split('.').pop()
          const contentType = ext === 'js' ? 'application/javascript' : 
                             ext === 'css' ? 'text/css' :
                             ext === 'woff2' ? 'font/woff2' :
                             ext === 'woff' ? 'font/woff' :
                             ext === 'ttf' ? 'font/ttf' :
                             ext === 'eot' ? 'application/vnd.ms-fontobject' :
                             ext === 'svg' ? 'image/svg+xml' :
                             ext === 'webmanifest' ? 'application/manifest+json' :
                             'application/octet-stream'
          res.writeHead(200, { 'Content-Type': contentType })
          res.end(asset)
        } catch (error) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Asset not found')
        }
        return
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
  }

  private setupEventHandlers() {
    this.wsServer.on('connection', (session: ClientSession) => {
      console.log(`Client connected: ${session.id}`)
      this.connectedUsers.add(session.id)
      this.broadcastUserCount()
    })

    this.wsServer.on('disconnection', (session: ClientSession) => {
      console.log(`Client disconnected: ${session.id}`)
      this.connectedUsers.delete(session.id)
      this.broadcastUserCount()
    })

    this.wsServer.on('message', (data: Uint8Array, _messageId: bigint, _timestamp: bigint, session: ClientSession) => {
      this.handleMessage(session.id, data)
    })

    this.wsServer.on('error', (error: Error) => {
      console.error('WebSocket server error:', error)
    })
  }

  private sendErrorMessage(clientId: string, message: string) {
    try {
      const errorResponse = {
        type: 'error',
        message: message,
        timestamp: Date.now()
      }
      const errorData = new TextEncoder().encode(JSON.stringify(errorResponse))
      // Find the client session and send error message
      const client = this.wsServer.getClient(clientId)
      if (client) {
        this.wsServer.sendToClient(client, errorData)
      }
      console.log(`📤 Sent error message to ${clientId}: ${message}`)
    } catch (error) {
      console.error('❌ Failed to send error message:', error)
    }
  }

  private handleMessage(clientId: string, data: Uint8Array) {
    console.log(`📥 Received message from ${clientId}, length: ${data.length}`)
    console.log(`📥 Data type: ${data.constructor.name}`)
    console.log(`📥 Raw data (first 20 bytes):`, Array.from(data.slice(0, 20)))
    
    // Check if this looks like binary FlatBuffers or text JSON
    const isLikelyText = data.every(byte => byte >= 32 && byte <= 126) // printable ASCII
    console.log(`📥 Data appears to be: ${isLikelyText ? 'TEXT (JSON)' : 'BINARY (FlatBuffers)'}`)
    
    try {
      // Check if data looks like JSON first (heuristic)
      const firstByte = data[0]
      const lastByte = data[data.length - 1]
      const looksLikeJson = (firstByte === 123 && lastByte === 125) || // { }
                          (firstByte === 91 && lastByte === 93) || // [ ]
                          (firstByte === 34) // starts with quote
      
      if (looksLikeJson) {
        console.log(`🔍 Data looks like JSON, trying JSON parsing first...`)
        try {
          const jsonString = new TextDecoder().decode(data)
          console.log(`Raw JSON string: ${jsonString}`)
          
          const chatData = JSON.parse(jsonString)
          console.log(`✅ Successfully parsed as JSON:`, chatData)
          
          // Process as direct chat message
          if (chatData.username && (chatData.type === 'chat' || chatData.type === 'color')) {
            console.log('Creating structured message from JSON...')
            const structuredMessage: StructuredMessage = chatData
            // Broadcast the message to all connected clients
            const messageData = new TextEncoder().encode(JSON.stringify(structuredMessage))
            this.wsServer.broadcast(messageData)
            return
          } else {
            console.log('❌ Invalid JSON message format')
            return
          }
        } catch (jsonError) {
          console.log(`⚠️ JSON parsing failed, trying FlatBuffers...`)
        }
      }
      
      // Try to parse as FlatBuffers message
      let message: Message
      try {
        const bb = new flatbuffers.ByteBuffer(data)
        message = Message.getRootAsMessage(bb)
        
        // Validate that this is actually a valid FlatBuffers message
        // Check if the message type is within valid range
        const messageType = message.type()
        if (messageType < 0 || messageType > 6) {
          throw new Error(`Invalid message type: ${messageType}`)
        }
        
        console.log(`✅ Successfully parsed FlatBuffers message`)
      } catch (flatbuffersError) {
        console.log(`⚠️ Failed to parse as FlatBuffers, trying as raw JSON...`)
        console.log(`FlatBuffers error:`, flatbuffersError)
        
        // If FlatBuffers parsing failed, send error response
        console.error('❌ Failed to parse as FlatBuffers:', flatbuffersError)
        this.sendErrorMessage(clientId, 'Malformed data received')
        return
      }
      
      console.log(`Message type: ${message.type()}`)
      console.log(`Message type name:`, MessageType[message.type()])
      console.log(`Message data type:`, message.dataType())
      console.log(`Full message object:`, message)
      
      if (message.type() === MessageType.Data) {
        console.log('Processing Data message...')
        try {
          const dataMessage = message.data(new DataMessage())
          if (!dataMessage) {
            console.error('❌ Failed to create DataMessage from FlatBuffers message')
            return
          }
          
          console.log('✅ DataMessage created successfully')
          const payload = dataMessage.payloadArray()
          if (!payload) {
            console.error('❌ No payload found in DataMessage')
            return
          }
          
          console.log('✅ Payload array found, length:', payload.length)
          // Decode the JSON payload
          const jsonData = new TextDecoder().decode(payload)
          console.log(`Raw message data: ${jsonData}`)
          
          // Clean up any potential JSON issues
          const cleanedJsonData = jsonData.trim()
          console.log(`Cleaned JSON data: ${cleanedJsonData}`)
          
          let chatData
          try {
            chatData = JSON.parse(cleanedJsonData)
            console.log('✅ Successfully parsed JSON payload:', chatData)
          } catch (error) {
            console.error('❌ Error parsing chat data from DataMessage:', error)
            console.error('Raw JSON data:', jsonData)
            console.error('Cleaned JSON data:', cleanedJsonData)
            this.sendErrorMessage(clientId, 'Malformed data received')
            return
          }
            
          if (chatData.username && (chatData.type === 'chat' || chatData.type === 'color')) {
            console.log('Creating structured message...')
            const structuredMessage: StructuredMessage = chatData

            // Broadcast the message to all connected clients
            const messageData = new TextEncoder().encode(JSON.stringify(structuredMessage))
            console.log('Broadcasting message to all clients...')
            this.wsServer.broadcast(messageData)
            
            if (chatData.type === 'color') {
              console.log(`✅ Color message from ${chatData.username}: ${chatData.data.message} (color: ${chatData.data.color})`)
            } else {
              console.log(`✅ Message from ${chatData.username}: ${chatData.data.message}`)
            }
          } else {
            console.log('❌ Missing username or invalid message type in chat data:', chatData)
          }
        } catch (dataMessageError) {
          console.error('❌ Error processing DataMessage:', dataMessageError)
          this.sendErrorMessage(clientId, 'Malformed data received')
          return
        }
      } else if (message.type() === MessageType.Connect) {
        console.log('Processing Connect message...')
        // Connect messages are just connection handshakes, not chat messages
        // No need to process them as chat data - just return early
        return
      } else {
        console.log('Not a Data or Connect message, type:', message.type())
        return
      }
    } catch (error) {
      console.error('❌ Error handling message:', error)
      console.error('Raw data:', data)
      
      // Send error response to client for any uncaught parsing exceptions
      this.sendErrorMessage(clientId, 'Malformed data received')
    }
  }

  private broadcastUserCount() {
    const userCountMessage: UserCountMessage = {
      type: 'userCount',
      count: this.connectedUsers.size
    }

    const messageData = new TextEncoder().encode(JSON.stringify(userCountMessage))
    this.wsServer.broadcast(messageData)
  }

  public async start() {
    try {
      // Start WebSocket server (which includes HTTP server)
      await this.wsServer.start()
      console.log(`🚀 WebSocket server started on port ${this.port}`)
      console.log(`🌐 HTTP server started on port ${this.port}`)
      console.log(`📱 Open http://localhost:${this.port} to access the chat demo`)
      console.log(`🔌 WebSocket available at ws://localhost:${this.port}`)
      console.log(`🔧 Render.com PORT environment: ${process.env['PORT']}`)
      console.log(`🔧 Server actually listening on: ${this.port}`)
      console.log(`🔧 Binding to 0.0.0.0 (required for Render.com)`)
      console.log(`🔧 Render.com default port: 10000`)

    } catch (error) {
      console.error('Failed to start chat server:', error)
      if (error instanceof Error && error.message.includes('EADDRINUSE')) {
        console.error(`❌ Port ${this.port} is already in use. Please run 'npm run cleanup:ports' first.`)
      }
      process.exit(1)
    }
  }

  public stop() {
    this.wsServer.stop()
    console.log('Chat server stopped')
  }
}

// Start the chat server
const chatServer = new ChatServer()
chatServer.start()

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down chat server...')
  chatServer.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down chat server...')
  chatServer.stop()
  process.exit(0)
})