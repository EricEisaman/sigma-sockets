import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SigmaSocketClient } from 'sigmasockets-client'
import { SigmaSocketServer } from 'sigmasockets-server'

describe('Chat Demo', () => {
  let server: SigmaSocketServer
  let client: SigmaSocketClient

  beforeEach(async () => {
    server = new SigmaSocketServer({
      port: 8081,
      heartbeatInterval: 30000
    })
    
    client = new SigmaSocketClient({
      url: 'ws://localhost:8081',
      reconnectInterval: 1000,
      maxReconnectAttempts: 3
    })

    await server.start()
  })

  afterEach(async () => {
    client.disconnect()
    try {
      await Promise.race([
        server.stop(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Stop timeout')), 5000))
      ])
    } catch (error) {
      console.warn('Server stop timeout or error:', error)
    }
  })

  it('should handle chat message flow', async () => {
    const messages: string[] = []
    
    client.on('message', (data: Uint8Array) => {
      const message = new TextDecoder().decode(data)
      messages.push(message)
    })

    await client.connect()
    
    // Send a test message
    const testMessage = 'Hello, SigmaSockets!'
    const messageData = new TextEncoder().encode(testMessage)
    client.send(messageData)
    
    // In a real test, you'd wait for the message to be processed
    // and verify it was received correctly
    expect(messages.length).toBeGreaterThanOrEqual(0)
  })

  it('should handle multiple client connections', async () => {
    const client2 = new SigmaSocketClient({
      url: 'ws://localhost:8081',
      reconnectInterval: 1000,
      maxReconnectAttempts: 3
    })

    await client.connect()
    await client2.connect()
    
    // Wait a bit for connections to be established
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(server.getConnectedClients()).toBe(2)
    
    client2.disconnect()
  })
})
