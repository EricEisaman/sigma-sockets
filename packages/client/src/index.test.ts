import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SigmaSocketClient, ConnectionStatus } from './index'

// Mock WebSocket globally
class MockWebSocket {
  public readyState: number = 1; // OPEN
  public binaryType: string = 'arraybuffer';
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate immediate connection
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: ArrayBuffer | Uint8Array): void {
    // Mock successful send
  }

  close(code?: number, reason?: string): void {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose({ type: 'close', code, reason } as CloseEvent);
    }
  }

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
}

// Replace global WebSocket
(global as any).WebSocket = MockWebSocket;

// Mock FlatBuffers
vi.mock('flatbuffers', () => ({
  Builder: class {
    constructor() {}
    startTable() { return 0; }
    endTable() { return 0; }
    startObject() { return 0; }
    endObject() { return 0; }
    startVector() { return 0; }
    endVector() { return 0; }
    addFieldOffset() {}
    addFieldInt8() {}
    addFieldInt64() {}
    addInt8() {}
    createString() { return 0; }
    createByteVector() { return 0; }
    finish() {}
    asUint8Array() { return new Uint8Array(); }
  },
  ByteBuffer: class {
    constructor() {}
  }
}));

describe('SigmaSocketClient', () => {
  let client: SigmaSocketClient

  beforeEach(() => {
    client = new SigmaSocketClient({
      url: 'ws://localhost:8080',
      reconnectInterval: 1000,
      maxReconnectAttempts: 3,
      heartbeatInterval: 30000
    })
  })

  afterEach(() => {
    client.disconnect()
  })

  it('should initialize with correct default values', () => {
    expect(client.getStatus()).toBe(ConnectionStatus.Disconnected)
    expect(client.getSession()).toBeNull()
  })

  it('should handle connection status changes', async () => {
    const statusChanges: ConnectionStatus[] = []
    
    client.on('connection', (status) => {
      statusChanges.push(status)
    })

    // Simulate connection attempt
    await client.connect()
    
    // Should see connecting and connected status changes
    expect(statusChanges).toContain(ConnectionStatus.Connecting)
    expect(statusChanges).toContain(ConnectionStatus.Connected)
  })

  it('should send data when connected', async () => {
    const testData = new TextEncoder().encode('test message')
    
    // Connect first
    await client.connect()
    
    // Wait a bit for connection to be established
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Now should be able to send data
    const result = client.send(testData)
    
    // Should return true when connected
    expect(result).toBe(true)
  })
})
