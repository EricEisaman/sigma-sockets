import { ConnectionQualityManager } from './connection-quality';
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

describe('ConnectionQualityManager', () => {
  let manager: ConnectionQualityManager;
  let client: ClientSession;

  beforeEach(() => {
    manager = new ConnectionQualityManager();
    client = createMockClientSession();
  });

  describe('initializeClientSession', () => {
    it('should initialize connection quality tracking', () => {
      manager.initializeClientSession(client);

      expect(client.connectionQuality).toBeDefined();
      expect(client.latencyHistory).toEqual([]);
      expect(client.lastPingTime).toBe(0);
      expect(client.missedHeartbeats).toBe(0);
      expect(client.adaptiveHeartbeatInterval).toBe(5000);
      expect(client.connectionScore).toBe(1.0);
    });
  });

  describe('recordPingPongLatency', () => {
    beforeEach(() => {
      manager.initializeClientSession(client);
    });

    it('should record latency and update connection quality', () => {
      manager.recordPingPongLatency(client, 50);

      expect(client.latencyHistory).toContain(50);
      expect(client.connectionQuality?.latency).toBe(50);
      expect(client.connectionQuality?.jitter).toBe(0);
    });

    it('should maintain latency history window size', () => {
      // Add more latencies than the window size
      for (let i = 0; i < 15; i++) {
        manager.recordPingPongLatency(client, i * 10);
      }

      expect(client.latencyHistory.length).toBe(10);
      expect(client.latencyHistory[0]).toBe(50); // First element should be 5 * 10
      expect(client.latencyHistory[9]).toBe(140); // Last element should be 14 * 10
    });

    it('should calculate jitter correctly', () => {
      manager.recordPingPongLatency(client, 50);
      manager.recordPingPongLatency(client, 60);
      manager.recordPingPongLatency(client, 40);

      const expectedJitter = Math.sqrt(((50-50)**2 + (60-50)**2 + (40-50)**2) / 3);
      expect(client.connectionQuality?.jitter).toBeCloseTo(expectedJitter, 2);
    });
  });

  describe('recordMissedHeartbeat', () => {
    beforeEach(() => {
      manager.initializeClientSession(client);
    });

    it('should increment missed heartbeats counter', () => {
      manager.recordMissedHeartbeat(client);
      expect(client.missedHeartbeats).toBe(1);

      manager.recordMissedHeartbeat(client);
      expect(client.missedHeartbeats).toBe(2);
    });

    it('should update connection quality metrics', () => {
      manager.recordPingPongLatency(client, 50);
      manager.recordMissedHeartbeat(client);

      expect(client.connectionQuality?.packetLoss).toBeGreaterThan(0);
    });
  });

  describe('adjustHeartbeatInterval', () => {
    beforeEach(() => {
      manager.initializeClientSession(client);
    });

    it('should increase interval for excellent connection quality', () => {
      // Simulate excellent connection quality
      client.connectionScore = 0.95;
      client.adaptiveHeartbeatInterval = 10000;

      manager.recordPingPongLatency(client, 20);
      
      expect(client.adaptiveHeartbeatInterval).toBeGreaterThan(10000);
    });

    it('should decrease interval for poor connection quality', () => {
      // Simulate poor connection quality
      client.connectionScore = 0.4;
      client.adaptiveHeartbeatInterval = 30000;

      manager.recordPingPongLatency(client, 200);
      
      expect(client.adaptiveHeartbeatInterval).toBeLessThan(30000);
    });

    it('should maintain interval bounds', () => {
      client.connectionScore = 0.95;
      client.adaptiveHeartbeatInterval = 50000;

      // Record many good latencies to increase interval
      for (let i = 0; i < 10; i++) {
        manager.recordPingPongLatency(client, 20);
      }

      expect(client.adaptiveHeartbeatInterval).toBeLessThanOrEqual(60000);
      expect(client.adaptiveHeartbeatInterval).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('getConnectionQualityMetrics', () => {
    beforeEach(() => {
      manager.initializeClientSession(client);
    });

    it('should return comprehensive quality metrics', () => {
      manager.recordPingPongLatency(client, 50);
      manager.recordPingPongLatency(client, 60);
      manager.recordPingPongLatency(client, 40);

      const metrics = manager.getConnectionQualityMetrics(client);

      expect(metrics.averageLatency).toBe(50);
      expect(metrics.maxLatency).toBe(60);
      expect(metrics.minLatency).toBe(40);
      expect(metrics.jitter).toBeGreaterThan(0);
      expect(metrics.packetLossRate).toBe(0);
      expect(metrics.connectionStability).toBeGreaterThan(0);
      expect(metrics.qualityScore).toBeGreaterThan(0);
    });

    it('should handle empty latency history', () => {
      const metrics = manager.getConnectionQualityMetrics(client);

      expect(metrics.averageLatency).toBe(0);
      expect(metrics.maxLatency).toBe(0);
      expect(metrics.minLatency).toBe(0);
      expect(metrics.jitter).toBe(0);
      expect(metrics.packetLossRate).toBe(0);
      expect(metrics.connectionStability).toBe(1.0);
      expect(metrics.qualityScore).toBe(1.0);
    });
  });

  describe('getRecommendedAction', () => {
    beforeEach(() => {
      manager.initializeClientSession(client);
    });

    it('should recommend maintain for good connection', () => {
      client.connectionScore = 0.8;
      expect(manager.getRecommendedAction(client)).toBe('maintain');
    });

    it('should recommend reduce_interval for poor connection', () => {
      client.connectionScore = 0.5;
      expect(manager.getRecommendedAction(client)).toBe('reduce_interval');
    });

    it('should recommend disconnect for very poor connection', () => {
      client.connectionScore = 0.2;
      expect(manager.getRecommendedAction(client)).toBe('disconnect');
    });
  });

  describe('isConnectionQualityPoor', () => {
    beforeEach(() => {
      manager.initializeClientSession(client);
    });

    it('should return true for poor connection quality', () => {
      client.connectionScore = 0.5;
      expect(manager.isConnectionQualityPoor(client)).toBe(true);
    });

    it('should return false for good connection quality', () => {
      client.connectionScore = 0.8;
      expect(manager.isConnectionQualityPoor(client)).toBe(false);
    });
  });
});
