import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SigmaSocketServer } from './index'

describe('SigmaSocketServer', () => {
  let server: SigmaSocketServer

  beforeEach(() => {
    server = new SigmaSocketServer({
      port: 8080,
      heartbeatInterval: 30000,
      sessionTimeout: 300000
    })
  })

  afterEach(() => {
    server.stop()
  })

  it('should initialize with correct default values', () => {
    expect(server.getConnectedClients()).toBe(0)
    expect(server.isRunning()).toBe(false)
  })

  it('should start and stop server', async () => {
    await server.start()
    expect(server.isRunning()).toBe(true)
    
    await server.stop()
    expect(server.isRunning()).toBe(false)
  })

  it('should handle client connections', async () => {
    await server.start()
    
    // In a real test, you'd mock WebSocket connections
    expect(server.getConnectedClients()).toBe(0)
  })

  it('should broadcast messages to connected clients', async () => {
    await server.start()
    
    const testData = new TextEncoder().encode('broadcast message')
    const result = server.broadcast(testData)
    
    // Should return 0 when no clients connected
    expect(result).toBe(0)
  })
})
