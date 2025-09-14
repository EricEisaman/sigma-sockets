import { PersistentConnectionManager } from './persistent-connection-manager';
import { ClientSession } from './types';
import { WebSocket } from 'ws';

// Mock WebSocket for testing
const createMockWebSocket = (): WebSocket => {
  return {
    readyState: WebSocket.OPEN,
    ping: jest.fn(),
    pong: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    once: jest.fn(),
    prependListener: jest.fn(),
    prependOnceListener: jest.fn(),
    removeAllListeners: jest.fn(),
    setMaxListeners: jest.fn(),
    getMaxListeners: jest.fn(),
    listeners: jest.fn(),
    rawListeners: jest.fn(),
    eventNames: jest.fn(),
    listenerCount: jest.fn()
  } as any;
};

const createMockClientSession = (id: string = 'test-client'): ClientSession => {
  return {
    id,
    lastMessageId: 0n,
    connectedAt: new Date(),
    lastHeartbeat: new Date(),
    ws: createMockWebSocket(),
    isAlive: true,
    messageBuffer: [],
    connectionQuality: {
      latency: 0,
      jitter: 0,
      packetLoss: 0,
      bandwidth: 0,
      stability: 1.0,
      lastUpdated: new Date()
    },
    latencyHistory: [],
    lastPingTime: 0,
    missedHeartbeats: 0,
    adaptiveHeartbeatInterval: 5000,
    connectionScore: 1.0
  };
};

describe('PersistentConnectionManager', () => {
  let manager: PersistentConnectionManager;
  let client: ClientSession;
  let ws: WebSocket;

  beforeEach(() => {
    manager = new PersistentConnectionManager(10, 1000, true, true); // Small pool for testing
    client = createMockClientSession();
    ws = createMockWebSocket();
  });

  describe('Connection Acquisition', () => {
    it('should create new connection for first request', () => {
      const result = manager.acquireConnection('client-1', ws, client);

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(result.connection).toBeDefined();
      expect(result.hitRate).toBe(0);
    });

    it('should reuse existing connection for subsequent requests', () => {
      // First request
      const result1 = manager.acquireConnection('client-1', ws, client);
      expect(result1.action).toBe('created');

      // Second request - should reuse
      const result2 = manager.acquireConnection('client-1', ws, client);
      expect(result2.success).toBe(true);
      expect(result2.action).toBe('reused');
      expect(result2.hitRate).toBeGreaterThan(0);
    });

    it('should handle connection pool full scenario', () => {
      // Fill up the connection pool
      for (let i = 0; i < 10; i++) {
        const mockClient = createMockClientSession(`client-${i}`);
        const mockWs = createMockWebSocket();
        manager.acquireConnection(`client-${i}`, mockWs, mockClient);
      }

      // Mark all connections as idle
      for (let i = 0; i < 10; i++) {
        manager.markConnectionIdle(`client-${i}`);
      }

      // Try to create new connection - should succeed by closing LRU connection
      const result = manager.acquireConnection('client-11', ws, client);
      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
    });

    it('should fail when pool is full and no idle connections', () => {
      // Fill up the connection pool
      for (let i = 0; i < 10; i++) {
        const mockClient = createMockClientSession(`client-${i}`);
        const mockWs = createMockWebSocket();
        manager.acquireConnection(`client-${i}`, mockWs, mockClient);
      }

      // Don't mark any as idle - all are active
      const result = manager.acquireConnection('client-11', ws, client);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Connection pool full');
    });
  });

  describe('Connection Management', () => {
    it('should mark connection as idle', () => {
      manager.acquireConnection('client-1', ws, client);
      manager.markConnectionIdle('client-1');

      const stats = manager.getStatistics();
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(1);
    });

    it('should close connection and clean up resources', () => {
      manager.acquireConnection('client-1', ws, client);
      manager.closeConnection('client-1', 'client_disconnect');

      const stats = manager.getStatistics();
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
    });

    it('should handle connection timeout', (done) => {
      manager.acquireConnection('client-1', ws, client);
      manager.markConnectionIdle('client-1');

      // Wait for timeout
      setTimeout(() => {
        const stats = manager.getStatistics();
        expect(stats.timeoutCloses).toBeGreaterThan(0);
        done();
      }, 1100); // Slightly longer than 1000ms timeout
    });
  });

  describe('Client Behavior Tracking', () => {
    it('should track client behavior for new connections', () => {
      manager.acquireConnection('client-1', ws, client);
      
      const insights = manager.getClientBehaviorInsights();
      expect(insights.totalClients).toBe(1);
      expect(insights.averageReuseRate).toBe(0);
    });

    it('should track connection reuse rate', () => {
      // First request
      manager.acquireConnection('client-1', ws, client);
      
      // Second request - should be tracked as reuse
      manager.acquireConnection('client-1', ws, client);
      
      const insights = manager.getClientBehaviorInsights();
      expect(insights.averageReuseRate).toBeGreaterThan(0);
      expect(insights.highReuseClients).toBe(1);
    });

    it('should identify high and low reuse clients', () => {
      // High reuse client
      manager.acquireConnection('high-reuse', ws, client);
      manager.acquireConnection('high-reuse', ws, client);
      manager.acquireConnection('high-reuse', ws, client);

      // Low reuse client
      manager.acquireConnection('low-reuse', ws, client);

      const insights = manager.getClientBehaviorInsights();
      expect(insights.highReuseClients).toBe(1);
      expect(insights.lowReuseClients).toBe(1);
    });
  });

  describe('Statistics and Analytics', () => {
    it('should provide accurate connection statistics', () => {
      manager.acquireConnection('client-1', ws, client);
      manager.acquireConnection('client-1', ws, client); // Reuse
      manager.markConnectionIdle('client-1');

      const stats = manager.getStatistics();
      expect(stats.totalConnections).toBe(1);
      expect(stats.totalRequests).toBe(2);
      expect(stats.connectionHits).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      // 3 requests, 2 reuses = 2 hits out of 3 requests = 66.7% hit rate
      manager.acquireConnection('client-1', ws, client);
      manager.acquireConnection('client-1', ws, client); // Hit 1
      manager.acquireConnection('client-1', ws, client); // Hit 2

      const stats = manager.getStatistics();
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });

    it('should calculate pool utilization', () => {
      // Fill 5 out of 10 connections
      for (let i = 0; i < 5; i++) {
        const mockClient = createMockClientSession(`client-${i}`);
        const mockWs = createMockWebSocket();
        manager.acquireConnection(`client-${i}`, mockWs, mockClient);
      }

      const stats = manager.getStatistics();
      expect(stats.poolUtilization).toBe(50);
    });
  });

  describe('Optimization Recommendations', () => {
    it('should recommend increasing timeout for low hit rate', () => {
      // Create scenario with low hit rate
      for (let i = 0; i < 5; i++) {
        const mockClient = createMockClientSession(`client-${i}`);
        const mockWs = createMockWebSocket();
        manager.acquireConnection(`client-${i}`, mockWs, mockClient);
      }

      const recommendations = manager.getOptimizationRecommendations();
      expect(recommendations.warnings).toContain('Low connection hit rate - consider increasing idle timeout');
      expect(recommendations.recommendations).toContain('Increase defaultIdleTimeout to improve connection reuse');
    });

    it('should recommend increasing pool size for high utilization', () => {
      // Fill up the pool
      for (let i = 0; i < 10; i++) {
        const mockClient = createMockClientSession(`client-${i}`);
        const mockWs = createMockWebSocket();
        manager.acquireConnection(`client-${i}`, mockWs, mockClient);
      }

      const recommendations = manager.getOptimizationRecommendations();
      expect(recommendations.warnings).toContain('Connection pool near capacity');
      expect(recommendations.recommendations).toContain('Consider increasing maxConnections or reducing idle timeout');
    });

    it('should provide optimization score', () => {
      const recommendations = manager.getOptimizationRecommendations();
      expect(recommendations.optimizationScore).toBeGreaterThanOrEqual(0);
      expect(recommendations.optimizationScore).toBeLessThanOrEqual(1);
    });
  });

  describe('LRU Policy', () => {
    it('should close least recently used connection when pool is full', () => {
      // Fill pool and mark all as idle
      for (let i = 0; i < 10; i++) {
        const mockClient = createMockClientSession(`client-${i}`);
        const mockWs = createMockWebSocket();
        manager.acquireConnection(`client-${i}`, mockWs, mockClient);
        manager.markConnectionIdle(`client-${i}`);
      }

      // Wait a bit to create LRU ordering
      setTimeout(() => {
        manager.markConnectionIdle('client-0'); // Update LRU timestamp

        // Try to create new connection
        const result = manager.acquireConnection('client-11', ws, client);
        expect(result.success).toBe(true);

        const stats = manager.getStatistics();
        expect(stats.forcedCloses).toBeGreaterThan(0);
      }, 100);
    });
  });

  describe('Adaptive Timeout', () => {
    it('should use conservative timeout for new clients', () => {
      manager.acquireConnection('new-client', ws, client);
      
      // New client should get shorter timeout
      const insights = manager.getClientBehaviorInsights();
      expect(insights.totalClients).toBe(1);
    });

    it('should use longer timeout for high-reuse clients', () => {
      // Create high-reuse client
      manager.acquireConnection('high-reuse', ws, client);
      manager.acquireConnection('high-reuse', ws, client);
      manager.acquireConnection('high-reuse', ws, client);

      const insights = manager.getClientBehaviorInsights();
      expect(insights.highReuseClients).toBe(1);
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up old behavior data', () => {
      // Create some behavior data
      manager.acquireConnection('client-1', ws, client);
      
      // Clean up immediately (maxAge = 0)
      manager.cleanupOldBehaviorData(0);
      
      const insights = manager.getClientBehaviorInsights();
      expect(insights.totalClients).toBe(0);
    });
  });
});
