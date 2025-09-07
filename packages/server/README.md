# SigmaSockets Server

A high-performance WebSocket server with built-in HTTP server capabilities for real-time applications.

## Features

- 🚀 **High Performance**: Built on top of the `ws` library with optimized message handling
- 🔒 **Security**: Built-in CORS, rate limiting, and security headers
- 📡 **Real-time**: WebSocket connections with heartbeat and session management
- 🌐 **HTTP Server**: Built-in HTTP server for serving static files and API endpoints
- 📦 **TypeScript**: Full TypeScript support with comprehensive type definitions
- 🔧 **Configurable**: Flexible configuration options for different use cases

## Installation

```bash
npm install sigmasockets-server
```

## Quick Start

### Basic WebSocket Server

```typescript
import { SigmaSocketServer } from 'sigmasockets-server'

const server = new SigmaSocketServer({
  port: 3000,
  host: '0.0.0.0'
})

// Handle client connections
server.on('connection', (session) => {
  console.log(`Client connected: ${session.id}`)
})

// Handle client disconnections
server.on('disconnection', (session, reason) => {
  console.log(`Client disconnected: ${session.id}, reason: ${reason}`)
})

// Handle incoming messages
server.on('message', (session, data, messageId, timestamp) => {
  console.log(`Message from ${session.id}:`, data)
  
  // Echo the message back to the client
  server.sendToClient(session, data)
})

// Start the server
await server.start()
console.log('Server started on port 3000')
```

### HTTP Server with Static File Serving

The SigmaSocketServer includes a built-in HTTP server that can serve static files and handle API endpoints:

```typescript
import { SigmaSocketServer } from 'sigmasockets-server'
import { readFileSync } from 'fs'
import { join } from 'path'

const server = new SigmaSocketServer({
  port: 3000,
  host: '0.0.0.0',
  requestHandler: (req, res) => {
    const url = req.url || '/'
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    // Health check endpoint
    if (url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }))
      return
    }

    // Serve static files
    if (url === '/') {
      try {
        const indexPath = join(process.cwd(), 'dist', 'index.html')
        const html = readFileSync(indexPath, 'utf8')
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
      } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('File not found')
      }
      return
    }

    // Serve other static assets
    if (url.startsWith('/assets/') || url.startsWith('/images/')) {
      try {
        const assetPath = join(process.cwd(), 'dist', url)
        const asset = readFileSync(assetPath)
        const ext = url.split('.').pop()
        const contentType = ext === 'js' ? 'application/javascript' : 
                           ext === 'css' ? 'text/css' :
                           ext === 'png' ? 'image/png' : 'application/octet-stream'
        
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(asset)
      } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Asset not found')
      }
      return
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
  }
})

// Start the server (handles both HTTP and WebSocket on the same port)
await server.start()
console.log('Server started on port 3000')
```

## Configuration Options

### SigmaSocketServerConfig

```typescript
interface SigmaSocketServerConfig {
  port: number                    // Port to listen on (required)
  host?: string                   // Host to bind to (default: '0.0.0.0')
  heartbeatInterval?: number      // Heartbeat interval in ms (default: 30000)
  sessionTimeout?: number         // Session timeout in ms (default: 300000)
  maxConnections?: number         // Maximum concurrent connections (default: 1000)
  bufferSize?: number            // Message buffer size (default: 4096)
  requestHandler?: (req: any, res: any) => void  // HTTP request handler (optional)
}
```

### Security Configuration

```typescript
interface SecurityConfig {
  cors: {
    origin: string | string[]     // CORS origins
    credentials: boolean          // Allow credentials
  }
  rateLimit: {
    windowMs: number             // Rate limit window in ms
    maxRequests: number          // Max requests per window
  }
  headers: Record<string, string> // Security headers
  ssl: {
    enabled: boolean             // Enable SSL
    redirectHttp: boolean        // Redirect HTTP to HTTPS
  }
}
```

## API Reference

### Events

- `connection`: Fired when a client connects
- `disconnection`: Fired when a client disconnects
- `message`: Fired when a message is received
- `error`: Fired when an error occurs

### Methods

- `start()`: Start the server
- `stop()`: Stop the server
- `broadcast(data, excludeClient?)`: Broadcast data to all connected clients
- `sendToClient(session, data)`: Send data to a specific client
- `getConnectedClients()`: Get number of connected clients
- `isRunning()`: Check if server is running
- `getStats()`: Get server statistics

## Examples

### Chat Application

```typescript
import { SigmaSocketServer } from 'sigmasockets-server'

const server = new SigmaSocketServer({
  port: 3000,
  requestHandler: (req, res) => {
    // Serve your chat application's static files
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('<html>...</html>')
    }
  }
})

server.on('connection', (session) => {
  console.log(`User connected: ${session.id}`)
})

server.on('message', (session, data, messageId, timestamp) => {
  // Broadcast chat message to all clients
  server.broadcast(data)
})

await server.start()
```

### Real-time Dashboard

```typescript
import { SigmaSocketServer } from 'sigmasockets-server'

const server = new SigmaSocketServer({
  port: 3000,
  requestHandler: (req, res) => {
    if (req.url === '/api/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        connectedUsers: server.getConnectedClients(),
        uptime: process.uptime()
      }))
    }
  }
})

// Send periodic updates to all connected clients
setInterval(() => {
  const metrics = {
    timestamp: Date.now(),
    cpu: process.cpuUsage(),
    memory: process.memoryUsage()
  }
  server.broadcast(new TextEncoder().encode(JSON.stringify(metrics)))
}, 5000)

await server.start()
```

## Performance

SigmaSockets Server is optimized for high-performance real-time applications:

- **Low Latency**: Minimal overhead for message processing
- **High Throughput**: Efficient message broadcasting
- **Memory Efficient**: Optimized session management
- **Scalable**: Configurable connection limits and timeouts

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.
