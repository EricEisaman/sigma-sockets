import { AdvancedFeaturesManager } from './advanced-features';
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

describe('AdvancedFeaturesManager', () => {
  let manager: AdvancedFeaturesManager;
  let client: ClientSession;

  beforeEach(() => {
    manager = new AdvancedFeaturesManager(1000);
    client = createMockClientSession();
  });

  describe('IoT Device Management', () => {
    it('should register IoT device successfully', () => {
      const deviceInfo = {
        deviceId: 'sensor-001',
        deviceType: 'sensor' as const,
        capabilities: ['temperature', 'humidity'],
        location: { latitude: 40.7128, longitude: -74.0060 }
      };

      manager.registerIoTDevice('test-client', deviceInfo);
      const registeredDevice = manager.getIoTDeviceInfo('test-client');

      expect(registeredDevice).toBeDefined();
      expect(registeredDevice?.deviceId).toBe('sensor-001');
      expect(registeredDevice?.deviceType).toBe('sensor');
      expect(registeredDevice?.capabilities).toEqual(['temperature', 'humidity']);
    });

    it('should update IoT device status', () => {
      const deviceInfo = {
        deviceId: 'sensor-001',
        deviceType: 'sensor' as const,
        capabilities: ['temperature']
      };

      manager.registerIoTDevice('test-client', deviceInfo);
      manager.updateIoTDeviceStatus('test-client', 'maintenance');

      const device = manager.getIoTDeviceInfo('test-client');
      expect(device?.status).toBe('maintenance');
    });
  });

  describe('Hybrid Protocol Support', () => {
    it('should enable hybrid protocol configuration', () => {
      const config = {
        protocols: ['websocket', 'http2', 'sse'] as const,
        fallbackOrder: ['websocket', 'http2', 'sse'],
        configuration: {
          http2PushEnabled: true,
          sseRetryInterval: 3000,
          http3QuicEnabled: false
        }
      };

      manager.enableHybridProtocol('test-client', config);
      const hybridConfig = manager.getHybridProtocolConfig('test-client');

      expect(hybridConfig).toBeDefined();
      expect(hybridConfig?.protocols).toEqual(['websocket', 'http2', 'sse']);
      expect(hybridConfig?.configuration.http2PushEnabled).toBe(true);
    });
  });

  describe('Connection Pool Management', () => {
    it('should add client to connection pool', () => {
      const result = manager.addToConnectionPool('test-client', client);
      expect(result).toBe(true);
    });

    it('should reject when connection pool is full', () => {
      // Fill up the connection pool
      for (let i = 0; i < 1000; i++) {
        const mockClient = createMockClientSession(`client-${i}`);
        manager.addToConnectionPool(`client-${i}`, mockClient);
      }

      const result = manager.addToConnectionPool('overflow-client', client);
      expect(result).toBe(false);
    });

    it('should remove client from connection pool', () => {
      manager.addToConnectionPool('test-client', client);
      manager.removeFromConnectionPool('test-client');

      const stats = manager.getConnectionPoolStats();
      expect(stats.totalConnections).toBe(0);
    });

    it('should provide accurate connection pool statistics', () => {
      manager.addToConnectionPool('client-1', client);
      manager.addToConnectionPool('client-2', createMockClientSession('client-2'));

      const deviceInfo = {
        deviceId: 'sensor-001',
        deviceType: 'sensor' as const,
        capabilities: ['temperature']
      };
      manager.registerIoTDevice('client-1', deviceInfo);

      const stats = manager.getConnectionPoolStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.iotConnections).toBe(1);
      expect(stats.regularConnections).toBe(1);
    });
  });

  describe('Security Validation', () => {
    it('should validate secure connections', () => {
      const mockRequest = {
        url: 'wss://example.com/ws',
        headers: {
          origin: 'https://example.com',
          'user-agent': 'Mozilla/5.0'
        }
      };

      const result = manager.validateConnectionSecurity(createMockWebSocket(), mockRequest);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about insecure connections', () => {
      const mockRequest = {
        url: 'ws://example.com/ws',
        headers: {
          origin: 'http://example.com'
        }
      };

      const result = manager.validateConnectionSecurity(createMockWebSocket(), mockRequest);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Connection is not using WSS (WebSocket Secure)');
      expect(result.recommendations).toContain('Consider using WSS for production environments');
    });

    it('should warn about missing origin header', () => {
      const mockRequest = {
        url: 'wss://example.com/ws',
        headers: {}
      };

      const result = manager.validateConnectionSecurity(createMockWebSocket(), mockRequest);
      expect(result.warnings).toContain('No origin header provided');
    });
  });

  describe('Cross-Origin Configuration', () => {
    it('should configure cross-origin support', () => {
      const config = manager.configureCrossOriginSupport(['https://example.com', 'https://app.com']);
      
      expect(config.allowedOrigins).toEqual(['https://example.com', 'https://app.com']);
      expect(config.credentials).toBe(false);
      expect(config.methods).toContain('GET');
      expect(config.maxAge).toBe(86400);
    });

    it('should validate cross-origin requests', () => {
      const config = manager.configureCrossOriginSupport(['https://example.com']);
      
      expect(manager.validateCrossOriginRequest('https://example.com', config)).toBe(true);
      expect(manager.validateCrossOriginRequest('https://malicious.com', config)).toBe(false);
    });

    it('should allow all origins when configured with wildcard', () => {
      const config = manager.configureCrossOriginSupport(['*']);
      
      expect(manager.validateCrossOriginRequest('https://any-origin.com', config)).toBe(true);
    });
  });

  describe('Real-Time Analytics', () => {
    beforeEach(() => {
      // Add some test clients
      manager.addToConnectionPool('client-1', createMockClientSession('client-1'));
      manager.addToConnectionPool('client-2', createMockClientSession('client-2'));
      
      const deviceInfo = {
        deviceId: 'sensor-001',
        deviceType: 'sensor' as const,
        capabilities: ['temperature']
      };
      manager.registerIoTDevice('client-1', deviceInfo);
    });

    it('should generate real-time analytics', () => {
      const analytics = manager.generateRealTimeAnalytics();
      
      expect(analytics.totalActiveConnections).toBe(2);
      expect(analytics.iotDeviceCount).toBe(1);
      expect(analytics.hybridProtocolUsage).toBe(0);
      expect(analytics.timestamp).toBeInstanceOf(Date);
    });

    it('should calculate connection quality distribution', () => {
      const analytics = manager.generateRealTimeAnalytics();
      
      expect(analytics.connectionQualityDistribution).toBeDefined();
      expect(typeof analytics.connectionQualityDistribution.excellent).toBe('number');
      expect(typeof analytics.connectionQualityDistribution.good).toBe('number');
      expect(typeof analytics.connectionQualityDistribution.fair).toBe('number');
      expect(typeof analytics.connectionQualityDistribution.poor).toBe('number');
    });
  });

  describe('Load Balancing Metrics', () => {
    it('should calculate load balancing metrics', () => {
      manager.addToConnectionPool('client-1', createMockClientSession('client-1'));
      
      const metrics = manager.calculateLoadBalancingMetrics();
      
      expect(metrics.currentLoad).toBe(1);
      expect(metrics.recentConnectionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.averageConnectionDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.connectionRates).toBeDefined();
      expect(metrics.recommendedScalingAction).toBeDefined();
    });

    it('should recommend scaling actions based on load', () => {
      // Test with low load
      const lowLoadMetrics = manager.calculateLoadBalancingMetrics();
      expect(['maintain', 'scale_down']).toContain(lowLoadMetrics.recommendedScalingAction);
    });
  });

  describe('Binary Data Optimization', () => {
    it('should optimize binary data transfer', () => {
      const testData = new Uint8Array(2048); // 2KB of data
      testData.fill(42); // Fill with test data
      
      const result = manager.optimizeBinaryDataTransfer(testData, true);
      
      expect(result.originalSize).toBe(2048);
      expect(result.processedSize).toBeLessThanOrEqual(2048);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.estimatedTransferTime).toBeGreaterThan(0);
      expect(result.optimizationApplied).toBe(true);
    });

    it('should skip compression for small data', () => {
      const testData = new Uint8Array(512); // 512 bytes
      testData.fill(42);
      
      const result = manager.optimizeBinaryDataTransfer(testData, true);
      
      expect(result.optimizationApplied).toBe(false);
      expect(result.processedSize).toBe(512);
    });

    it('should handle compression disabled', () => {
      const testData = new Uint8Array(2048);
      testData.fill(42);
      
      const result = manager.optimizeBinaryDataTransfer(testData, false);
      
      expect(result.optimizationApplied).toBe(false);
      expect(result.processedSize).toBe(2048);
    });
  });
});
