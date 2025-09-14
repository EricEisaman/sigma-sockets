import * as flatbuffers from 'flatbuffers';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer, Server } from 'http';
import { Message } from './generated/sigma-sockets/message';
import { MessageType } from './generated/sigma-sockets/message-type';
import { MessageData } from './generated/sigma-sockets/message-data';
import { ConnectMessage } from './generated/sigma-sockets/connect-message';
import { DataMessage } from './generated/sigma-sockets/data-message';
import { HeartbeatMessage } from './generated/sigma-sockets/heartbeat-message';
import { ReconnectMessage } from './generated/sigma-sockets/reconnect-message';
import { DisconnectMessage } from './generated/sigma-sockets/disconnect-message';
import { ErrorMessage } from './generated/sigma-sockets/error-message';
// import { MessageValidator } from './validation'; // Not needed with hybrid handler
import { SecurityManager, createSecureWebSocketConfig, defaultSecurityConfig, type SecurityConfig } from './security';
import { ConnectionQualityManager } from './connection-quality';
import { AdvancedFeaturesManager } from './advanced-features';
import { PersistentConnectionManager } from './persistent-connection-manager';
import { HybridMessageHandler } from './hybrid-message-handler';
// Note: FlatBuffers generator is only available in Node.js environments
// import { generateFlatBuffers, getDefaultSchema, type FlatBuffersConfig, type FlatBuffersResult } from './flatbuffers-generator';
import type {
  SigmaSocketServerConfig,
  RequiredSigmaSocketServerConfig,
  ClientSession,
  SigmaSocketServerEvents,
  ServerStats
} from './types';

export class SigmaSocketServer {
  private config: RequiredSigmaSocketServerConfig;
  private requestHandler: ((req: any, res: any) => void) | undefined;
  private httpServer: Server;
  private wsServer: WebSocketServer;
  private clients: Map<string, ClientSession> = new Map();
  private disconnectedSessions: Map<string, ClientSession> = new Map();
  private eventListeners: Map<keyof SigmaSocketServerEvents, Set<Function>> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private stats: ServerStats;
  private startTime: Date;
  private securityManager: SecurityManager;
  private connectionQualityManager: ConnectionQualityManager;
  private advancedFeaturesManager: AdvancedFeaturesManager;
  private persistentConnectionManager: PersistentConnectionManager;

  constructor(config: SigmaSocketServerConfig, securityConfig?: SecurityConfig) {
    const { requestHandler, ...configWithoutHandler } = config;
    
    this.config = {
      port: configWithoutHandler.port,
      host: configWithoutHandler.host ?? '0.0.0.0',
      heartbeatInterval: configWithoutHandler.heartbeatInterval ?? 30000,
      sessionTimeout: configWithoutHandler.sessionTimeout ?? 300000,
      maxConnections: configWithoutHandler.maxConnections ?? 1000,
      bufferSize: configWithoutHandler.bufferSize ?? 4096,
      // Enhanced connection quality settings
      minHeartbeatInterval: configWithoutHandler.minHeartbeatInterval ?? 5000,
      maxHeartbeatInterval: configWithoutHandler.maxHeartbeatInterval ?? 60000,
      latencyWindowSize: configWithoutHandler.latencyWindowSize ?? 10,
      qualityCheckInterval: configWithoutHandler.qualityCheckInterval ?? 10000,
      adaptiveHeartbeatEnabled: configWithoutHandler.adaptiveHeartbeatEnabled ?? true,
      connectionQualityThreshold: configWithoutHandler.connectionQualityThreshold ?? 0.7
    };
    this.requestHandler = requestHandler;

    // Initialize security manager
    this.securityManager = new SecurityManager(securityConfig);

    // Initialize connection quality manager
    this.connectionQualityManager = new ConnectionQualityManager(
      this.config.minHeartbeatInterval,
      this.config.maxHeartbeatInterval,
      this.config.latencyWindowSize,
      this.config.connectionQualityThreshold
    );

    // Initialize advanced features manager
    this.advancedFeaturesManager = new AdvancedFeaturesManager(this.config.maxConnections);

    // Initialize persistent connection manager
    this.persistentConnectionManager = new PersistentConnectionManager(
      this.config.maxConnections,
      this.config.sessionTimeout,
      true, // adaptive timeout enabled
      true  // LRU enabled
    );

    this.startTime = new Date();
    this.stats = {
      connectedClients: 0,
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      messagesReceived: 0n,
      messagesSent: 0n,
      uptime: 0,
      averageLatency: 0
    };

    // Initialize event listener sets
    this.eventListeners.set('connection', new Set());
    this.eventListeners.set('disconnection', new Set());
    this.eventListeners.set('message', new Set());
    this.eventListeners.set('error', new Set());

    // Create HTTP server for WebSocket upgrade
    this.httpServer = createServer();
    
    // Create WebSocket server with security configuration
    const wsConfig = createSecureWebSocketConfig(securityConfig || defaultSecurityConfig);
    this.wsServer = new WebSocketServer({
      server: this.httpServer,
      ...wsConfig
    });

    // Add HTTP request handler after WebSocket server is created
    this.httpServer.on('request', (req, res) => {
      // Handle regular HTTP requests with the provided handler
      if (this.requestHandler) {
        this.requestHandler(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
    });

    this.setupWebSocketServer();
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.config.port, this.config.host, () => {
        console.log(`SigmaSocket server listening on ${this.config.host}:${this.config.port}`);
        this.startHeartbeat();
        this.startCleanup();
        resolve();
      });

      this.httpServer.on('error', (error) => {
        this.emit('error', error);
        reject(error);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.clearTimers();
      
      // Close all client connections
      this.clients.forEach((client) => {
        this.disconnectClient(client, 'Server shutdown');
      });

      // Close WebSocket server
      this.wsServer.close(() => {
        // Close HTTP server
        this.httpServer.close(() => {
          console.log('SigmaSocket server stopped');
          resolve();
        });
      });
    });
  }

  public getHttpServer(): Server {
    return this.httpServer;
  }

  public broadcast(data: Uint8Array, excludeClient?: string): number {
    let sentCount = 0;
    const messageId = this.generateMessageId();
    const timestamp = BigInt(Date.now());

    this.clients.forEach((client) => {
      if (excludeClient && client.id === excludeClient) {
        return;
      }

      if (this.sendToClient(client, data, messageId, timestamp)) {
        sentCount++;
      }
    });

    return sentCount;
  }

  public sendToClient(client: ClientSession, data: Uint8Array, messageId?: bigint, timestamp?: bigint): boolean {
    if (client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const builder = new flatbuffers.Builder(1024 + data.length);
      const payload = DataMessage.createPayloadVector(builder, data);
      const msgId = messageId ?? this.generateMessageId();
      const ts = timestamp ?? BigInt(Date.now());

      DataMessage.startDataMessage(builder);
      DataMessage.addPayload(builder, payload);
      DataMessage.addMessageId(builder, msgId);
      DataMessage.addTimestamp(builder, ts);
      const dataMsg = DataMessage.endDataMessage(builder);

      Message.startMessage(builder);
      Message.addType(builder, MessageType.Data);
      Message.addDataType(builder, MessageData.DataMessage);
      Message.addData(builder, dataMsg);
      const message = Message.endMessage(builder);

      builder.finish(message);
      client.ws.send(builder.asUint8Array());

      client.lastMessageId = msgId;
      this.stats.messagesSent++;
      return true;
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  public getClient(sessionId: string): ClientSession | undefined {
    return this.clients.get(sessionId);
  }

  public getStats(): ServerStats {
    this.stats.uptime = Date.now() - this.startTime.getTime();
    this.stats.connectedClients = this.clients.size;
    return { ...this.stats };
  }

  public on<K extends keyof SigmaSocketServerEvents>(event: K, callback: SigmaSocketServerEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  public off<K extends keyof SigmaSocketServerEvents>(event: K, callback: SigmaSocketServerEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private setupWebSocketServer(): void {
    this.wsServer.on('connection', (ws: WebSocket, _request) => {
      // Check connection limits
      if (this.clients.size >= this.config.maxConnections) {
        ws.close(1013, 'Server at capacity');
        return;
      }

      ws.binaryType = 'arraybuffer';
      
      // Set up WebSocket event handlers
      ws.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
        // Ensure we're working with a Buffer
        let bufferData: Buffer;
        if (Buffer.isBuffer(data)) {
          bufferData = data;
        } else if (data instanceof ArrayBuffer) {
          bufferData = Buffer.from(data);
        } else if (Array.isArray(data)) {
          bufferData = Buffer.concat(data);
        } else {
          console.error('🔧 [SERVER] Unexpected data type received:', typeof data, (data as any).constructor?.name || 'unknown');
          return;
        }
        
        this.handleWebSocketMessage(ws, bufferData);
      });

      ws.on('close', (code: number, reason: Buffer) => {
        this.handleWebSocketClose(ws, code, reason.toString());
      });

      ws.on('error', (error: Error) => {
        this.handleWebSocketError(ws, error);
      });

      ws.on('pong', () => {
        // Mark client as alive on pong response and record latency
        const client = this.findClientByWebSocket(ws);
        if (client) {
          client.isAlive = true;
          client.lastHeartbeat = new Date();
          
          // Record ping-pong latency for connection quality monitoring
          if (client.lastPingTime > 0) {
            const latency = Date.now() - client.lastPingTime;
            this.connectionQualityManager.recordPingPongLatency(client, latency);
            client.lastPingTime = 0; // Reset ping time
          }
          
          // Reset missed heartbeats counter
          this.connectionQualityManager.resetMissedHeartbeats(client);
        }
      });
    });

    this.wsServer.on('error', (error) => {
      this.emit('error', error);
    });
  }

  private handleJSONMessage(ws: WebSocket, hybridResult: any): void {
    const client = this.findClientByWebSocket(ws);
    const clientId = client?.id || 'unknown';
    
    console.log(`📥 Handling JSON message from ${clientId}:`, hybridResult.data);
    
    // Handle different JSON message types
    switch (hybridResult.messageType) {
      case MessageType.Connect:
        // For JSON connect messages, create a client session
        if (!client) {
          this.handleConnectMessage(ws, null as any); // Create session through existing handler
        }
        break;
        
      case MessageType.Data:
        // Handle data messages (like test messages)
        this.handleJSONDataMessage(ws, hybridResult.data);
        break;
        
      case MessageType.Heartbeat:
        // Handle heartbeat messages
        this.handleJSONHeartbeatMessage(ws, hybridResult.data);
        break;
        
      default:
        console.log(`📥 Unhandled JSON message type: ${hybridResult.messageType}`);
    }
  }

  private handleJSONDataMessage(ws: WebSocket, data: any): void {
    const client = this.findClientByWebSocket(ws);
    const clientId = client?.id || 'unknown';
    
    console.log(`📥 JSON Data message from ${clientId}:`, data);
    
    // Send response back to client
    const response = {
      type: 'response',
      originalType: data.type,
      timestamp: Date.now(),
      received: true,
      clientId: clientId
    };
    
    // Send as JSON response
    ws.send(JSON.stringify(response));
    
    // Update stats
    this.stats.messagesReceived++;
  }

  private handleJSONHeartbeatMessage(ws: WebSocket, _data: any): void {
    const client = this.findClientByWebSocket(ws);
    if (client) {
      client.isAlive = true;
      client.lastHeartbeat = new Date();
      
      // Record ping-pong latency if we have ping time
      if (client.lastPingTime) {
        const latency = Date.now() - client.lastPingTime;
        this.connectionQualityManager.recordPingPongLatency(client, latency);
        client.lastPingTime = 0;
      }
      
      // Reset missed heartbeats
      client.missedHeartbeats = 0;
    }
    
    // Send heartbeat response
    const response = {
      type: 'heartbeat_response',
      timestamp: Date.now()
    };
    
    ws.send(JSON.stringify(response));
  }

  private handleWebSocketMessage(ws: WebSocket, data: Buffer): void {
    try {
      // Find client for rate limiting
      const client = this.findClientByWebSocket(ws);
      const clientId = client?.id || 'unknown';
      
      // Critical debugging for binary data handling
      console.log(`🔧 [SERVER] Received WebSocket message from ${clientId}`);
      console.log(`🔧 [SERVER] Data type: ${data.constructor.name}`);
      console.log(`🔧 [SERVER] Data length: ${data.length}`);
      console.log(`🔧 [SERVER] First 20 bytes: [${Array.from(data.slice(0, 20)).join(', ')}]`);
      console.log(`🔧 [SERVER] WebSocket binaryType: ${ws.binaryType}`);
      console.log(`🔧 [SERVER] Is Buffer: ${Buffer.isBuffer(data)}`);
      console.log(`🔧 [SERVER] Is ArrayBuffer: ${data instanceof ArrayBuffer}`);
      
      // Check if data looks like text (JSON) or binary (FlatBuffers)
      const isTextData = data.every(byte => byte >= 32 && byte <= 126);
      console.log(`🔧 [SERVER] Data appears to be: ${isTextData ? 'TEXT (JSON)' : 'BINARY (FlatBuffers)'}`);
      
      // If it's text data, log the actual string
      if (isTextData) {
        const textData = data.toString('utf8');
        console.log(`🔧 [SERVER] Text content: ${textData.substring(0, 100)}...`);
      }

      // Validate message size
      const sizeValidation = this.securityManager.validateMessageSize(data);
      if (!sizeValidation.valid) {
        this.securityManager.logSecurityEvent('invalid_message_size', clientId, sizeValidation.error);
        console.warn(`⚠️ Invalid message size from ${clientId}: ${sizeValidation.error}`);
        return;
      }

      // Use hybrid message handler to support both JSON and FlatBuffers
      const hybridResult = HybridMessageHandler.handleMessage(new Uint8Array(data));
      if (!hybridResult.success) {
        this.securityManager.logSecurityEvent('invalid_message', clientId, hybridResult.error);
        console.warn(`⚠️ Invalid message from ${clientId}: ${hybridResult.error}`);
        return;
      }

      console.log(`✅ Successfully parsed ${hybridResult.isJSON ? 'JSON' : 'FlatBuffers'} message:`, hybridResult.messageType);

      // For JSON messages, we need to handle them differently
      if (hybridResult.isJSON) {
        this.handleJSONMessage(ws, hybridResult);
        return;
      }

      // For FlatBuffers messages, continue with existing logic
      const buffer = new Uint8Array(data);
      const buf = new flatbuffers.ByteBuffer(buffer);
      const message = Message.getRootAsMessage(buf);

      // Skip all rate limiting and DoS detection for chat demo
      // Only apply security checks in production environments
      if (process.env['NODE_ENV'] === 'production' && message.type() === MessageType.Data) {
        // Check rate limiting for data messages only in production
        if (!this.securityManager.checkRateLimit(clientId)) {
          this.securityManager.logSecurityEvent('rate_limit_exceeded', clientId);
          console.warn(`⚠️ Rate limit exceeded for ${clientId}`);
          return;
        }

        // Check for DoS attacks on data messages only in production
        if (this.securityManager.detectDoSAttack(clientId, data.length)) {
          this.securityManager.logSecurityEvent('dos_attack', clientId, { messageSize: data.length });
          console.warn(`⚠️ DoS attack detected from ${clientId}, message size: ${data.length}`);
          return;
        }
      }

      switch (message.type()) {
        case MessageType.Connect:
          this.handleConnectMessage(ws, message);
          break;
        case MessageType.Reconnect:
          this.handleReconnectMessage(ws, message);
          break;
        case MessageType.Data:
          this.handleDataMessage(ws, message);
          break;
        case MessageType.Heartbeat:
          this.handleHeartbeatMessage(ws, message);
          break;
        case MessageType.Disconnect:
          this.handleDisconnectMessage(ws, message);
          break;
      }

      this.stats.messagesReceived++;
    } catch (error) {
      this.securityManager.logSecurityEvent('message_processing_error', 'unknown', error);
      this.sendErrorToWebSocket(ws, 500, 'Internal server error');
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private handleConnectMessage(ws: WebSocket, message: Message): void {
    const connectMsg = message.data(new ConnectMessage());
    if (!connectMsg) {
      this.sendErrorToWebSocket(ws, 400, 'Invalid connect message');
      return;
    }

    const sessionId = connectMsg.sessionId();
    const clientVersion = connectMsg.clientVersion();

    if (!sessionId) {
      this.sendErrorToWebSocket(ws, 400, 'Session ID required');
      return;
    }

    // Check if session already exists
    if (this.clients.has(sessionId)) {
      this.sendErrorToWebSocket(ws, 409, 'Session already connected');
      return;
    }

    // Create new client session
    const client: ClientSession = {
      id: sessionId,
      ws: ws,
      lastMessageId: 0n,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      isAlive: true,
      messageBuffer: [],
      // Initialize connection quality tracking
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
      adaptiveHeartbeatInterval: this.config.minHeartbeatInterval,
      connectionScore: 1.0
    };

    // Initialize connection quality tracking
    this.connectionQualityManager.initializeClientSession(client);

    this.clients.set(sessionId, client);
    this.stats.totalConnections++;

    // Add to advanced features connection pool
    this.advancedFeaturesManager.addToConnectionPool(sessionId, client);

    console.log(`Client connected: ${sessionId} (version: ${clientVersion})`);
    this.emit('connection', client);
  }

  private handleReconnectMessage(ws: WebSocket, message: Message): void {
    const reconnectMsg = message.data(new ReconnectMessage());
    if (!reconnectMsg) {
      this.sendErrorToWebSocket(ws, 400, 'Invalid reconnect message');
      return;
    }

    const sessionId = reconnectMsg.sessionId();

    if (!sessionId) {
      this.sendErrorToWebSocket(ws, 400, 'Session ID required');
      return;
    }

    // Check if we have a disconnected session to restore
    const disconnectedSession = this.disconnectedSessions.get(sessionId);
    if (disconnectedSession) {
      // Restore session
      disconnectedSession.ws = ws;
      disconnectedSession.lastHeartbeat = new Date();
      disconnectedSession.isAlive = true;

      this.clients.set(sessionId, disconnectedSession);
      this.disconnectedSessions.delete(sessionId);

      // Replay buffered messages if any
      if (disconnectedSession.messageBuffer.length > 0) {
        disconnectedSession.messageBuffer.forEach((bufferedData) => {
          this.sendToClient(disconnectedSession, bufferedData);
        });
        disconnectedSession.messageBuffer = [];
      }

      console.log(`Client reconnected: ${sessionId}`);
      this.emit('connection', disconnectedSession);
    } else {
      // No session to restore, treat as new connection
      this.sendErrorToWebSocket(ws, 404, 'Session not found');
    }
  }

  private handleDataMessage(ws: WebSocket, message: Message): void {
    const client = this.findClientByWebSocket(ws);
    if (!client) {
      this.sendErrorToWebSocket(ws, 401, 'Client not authenticated');
      return;
    }

    const dataMsg = message.data(new DataMessage());
    if (!dataMsg) {
      this.sendErrorToWebSocket(ws, 400, 'Invalid data message');
      return;
    }

    const payload = new Uint8Array(dataMsg.payloadLength());
    for (let i = 0; i < dataMsg.payloadLength(); i++) {
      payload[i] = dataMsg.payload(i) ?? 0;
    }

    client.lastMessageId = dataMsg.messageId();
    this.emit('message', payload, dataMsg.messageId(), dataMsg.timestamp(), client);
  }

  private handleHeartbeatMessage(ws: WebSocket, _message: Message): void {
    const client = this.findClientByWebSocket(ws);
    if (!client) {
      return;
    }

    client.lastHeartbeat = new Date();
    client.isAlive = true;

    // Send heartbeat response
    const builder = new flatbuffers.Builder(256);
    const timestamp = BigInt(Date.now());

    HeartbeatMessage.startHeartbeatMessage(builder);
    HeartbeatMessage.addTimestamp(builder, timestamp);
    const heartbeatMsg = HeartbeatMessage.endHeartbeatMessage(builder);

    Message.startMessage(builder);
    Message.addType(builder, MessageType.Heartbeat);
    Message.addDataType(builder, MessageData.HeartbeatMessage);
    Message.addData(builder, heartbeatMsg);
    const responseMessage = Message.endMessage(builder);

    builder.finish(responseMessage);
    ws.send(builder.asUint8Array());
  }

  private handleDisconnectMessage(ws: WebSocket, message: Message): void {
    const client = this.findClientByWebSocket(ws);
    if (client) {
      const disconnectMsg = message.data(new DisconnectMessage());
      const reason = disconnectMsg?.reason() ?? 'Client disconnect';
      this.disconnectClient(client, reason);
    }
  }

  private handleWebSocketClose(ws: WebSocket, code: number, reason: string): void {
    const client = this.findClientByWebSocket(ws);
    if (client) {
      // Move to disconnected sessions for potential reconnection
      this.clients.delete(client.id);
      this.disconnectedSessions.set(client.id, client);

      console.log(`Client disconnected: ${client.id} (code: ${code}, reason: ${reason})`);
      this.emit('disconnection', client, reason);

      // Schedule cleanup of disconnected session
      setTimeout(() => {
        this.disconnectedSessions.delete(client.id);
      }, this.config.sessionTimeout);
    }
  }

  private handleWebSocketError(ws: WebSocket, error: Error): void {
    const client = this.findClientByWebSocket(ws);
    if (client) {
      console.error(`WebSocket error for client ${client.id}:`, error);
    }
    this.emit('error', error);
  }

  private disconnectClient(client: ClientSession, reason: string): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.close(1000, reason);
    }
    this.clients.delete(client.id);
    
    // Remove from advanced features connection pool
    this.advancedFeaturesManager.removeFromConnectionPool(client.id);
    
    this.emit('disconnection', client, reason);
  }

  private sendErrorToWebSocket(ws: WebSocket, code: number, message: string): void {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const builder = new flatbuffers.Builder(512);
      const errorMsg = builder.createString(message);

      ErrorMessage.startErrorMessage(builder);
      ErrorMessage.addCode(builder, code);
      ErrorMessage.addMessage(builder, errorMsg);
      const errorMsgObj = ErrorMessage.endErrorMessage(builder);

      Message.startMessage(builder);
      Message.addType(builder, MessageType.Error);
      Message.addDataType(builder, MessageData.ErrorMessage);
      Message.addData(builder, errorMsgObj);
      const responseMessage = Message.endMessage(builder);

      builder.finish(responseMessage);
      ws.send(builder.asUint8Array());
    } catch (error) {
      console.error('Failed to send error message:', error);
    }
  }

  private findClientByWebSocket(ws: WebSocket): ClientSession | undefined {
    for (const client of this.clients.values()) {
      if (client.ws === ws) {
        return client;
      }
    }
    return undefined;
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          // Client didn't respond to previous ping, record missed heartbeat
          this.connectionQualityManager.recordMissedHeartbeat(client);
          
          // Check if connection quality is too poor
          if (this.connectionQualityManager.getRecommendedAction(client) === 'disconnect') {
            this.disconnectClient(client, 'Connection quality too poor');
            return;
          }
        }

        // Mark as not alive and send ping
        client.isAlive = false;
        if (client.ws.readyState === WebSocket.OPEN) {
          // Record ping time for latency calculation
          client.lastPingTime = Date.now();
          client.ws.ping(); // Fixed: use ping() instead of pong()
        }
      });
    }, this.config.heartbeatInterval);
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const timeout = this.config.sessionTimeout;

      // Clean up old disconnected sessions
      this.disconnectedSessions.forEach((session, sessionId) => {
        if (now - session.lastHeartbeat.getTime() > timeout) {
          this.disconnectedSessions.delete(sessionId);
          console.log(`Cleaned up expired session: ${sessionId}`);
        }
      });
    }, this.config.sessionTimeout / 2);
  }

  private clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get the number of connected clients
   */
  getConnectedClients(): number {
    return this.clients.size;
  }

  /**
   * Check if the server is running
   */
  isRunning(): boolean {
    return this.httpServer.listening;
  }

  /**
   * Get connection quality metrics for a specific client
   */
  getConnectionQualityMetrics(sessionId: string): any | null {
    const client = this.clients.get(sessionId);
    if (!client) {
      return null;
    }
    return this.connectionQualityManager.getConnectionQualityMetrics(client);
  }

  /**
   * Get all connection quality metrics
   */
  getAllConnectionQualityMetrics(): Map<string, any> {
    const metrics = new Map<string, any>();
    this.clients.forEach((client, sessionId) => {
      metrics.set(sessionId, this.connectionQualityManager.getConnectionQualityMetrics(client));
    });
    return metrics;
  }

  /**
   * Get adaptive heartbeat interval for a specific client
   */
  getAdaptiveHeartbeatInterval(sessionId: string): number | null {
    const client = this.clients.get(sessionId);
    if (!client) {
      return null;
    }
    return this.connectionQualityManager.getAdaptiveHeartbeatInterval(client);
  }

  /**
   * Advanced Features - IoT Device Management
   */
  registerIoTDevice(sessionId: string, deviceInfo: any): boolean {
    const client = this.clients.get(sessionId);
    if (!client) {
      return false;
    }
    
    this.advancedFeaturesManager.registerIoTDevice(sessionId, deviceInfo);
    return true;
  }

  getIoTDeviceInfo(sessionId: string): any | null {
    return this.advancedFeaturesManager.getIoTDeviceInfo(sessionId);
  }

  /**
   * Advanced Features - Hybrid Protocol Support
   */
  enableHybridProtocol(sessionId: string, config: any): boolean {
    const client = this.clients.get(sessionId);
    if (!client) {
      return false;
    }
    
    this.advancedFeaturesManager.enableHybridProtocol(sessionId, config);
    return true;
  }

  /**
   * Advanced Features - Real-time Analytics
   */
  getRealTimeAnalytics(): any {
    return this.advancedFeaturesManager.generateRealTimeAnalytics();
  }

  /**
   * Advanced Features - Load Balancing Metrics
   */
  getLoadBalancingMetrics(): any {
    return this.advancedFeaturesManager.calculateLoadBalancingMetrics();
  }

  /**
   * Advanced Features - Connection Pool Statistics
   */
  getConnectionPoolStats(): any {
    return this.advancedFeaturesManager.getConnectionPoolStats();
  }

  /**
   * Advanced Features - Security Validation
   */
  validateConnectionSecurity(ws: WebSocket, request: any): any {
    return this.advancedFeaturesManager.validateConnectionSecurity(ws, request);
  }

  /**
   * Advanced Features - Binary Data Optimization
   */
  optimizeBinaryDataTransfer(data: Uint8Array, compressionEnabled: boolean = true): any {
    return this.advancedFeaturesManager.optimizeBinaryDataTransfer(data, compressionEnabled);
  }

  /**
   * Persistent Connection Management - Get connection pool statistics
   */
  getConnectionPoolStatistics(): any {
    return this.persistentConnectionManager.getStatistics();
  }

  /**
   * Persistent Connection Management - Get client behavior insights
   */
  getClientBehaviorInsights(): any {
    return this.persistentConnectionManager.getClientBehaviorInsights();
  }

  /**
   * Persistent Connection Management - Get optimization recommendations
   */
  getOptimizationRecommendations(): any {
    return this.persistentConnectionManager.optimizeConnectionPool();
  }

  /**
   * Persistent Connection Management - Clean up old behavior data
   */
  cleanupOldBehaviorData(maxAge?: number): void {
    this.persistentConnectionManager.cleanupOldBehaviorData(maxAge);
  }

  private generateMessageId(): bigint {
    return BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));
  }

  private emit<K extends keyof SigmaSocketServerEvents>(event: K, ...args: Parameters<SigmaSocketServerEvents[K]>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as Function)(...args);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }
}

// Export types
export type { 
  ClientSession, 
  ServerStats, 
  SigmaSocketServerConfig, 
  ConnectionQuality, 
  ConnectionQualityMetrics 
} from './types';

