export interface SigmaSocketServerConfig {
  port: number;
  host?: string;
  heartbeatInterval?: number;
  sessionTimeout?: number;
  maxConnections?: number;
  bufferSize?: number;
  requestHandler?: (req: any, res: any) => void;
  // Enhanced connection quality settings
  minHeartbeatInterval?: number;
  maxHeartbeatInterval?: number;
  latencyWindowSize?: number;
  qualityCheckInterval?: number;
  adaptiveHeartbeatEnabled?: boolean;
  connectionQualityThreshold?: number;
}

export interface RequiredSigmaSocketServerConfig {
  port: number;
  host: string;
  heartbeatInterval: number;
  sessionTimeout: number;
  maxConnections: number;
  bufferSize: number;
  // Enhanced connection quality settings
  minHeartbeatInterval: number;
  maxHeartbeatInterval: number;
  latencyWindowSize: number;
  qualityCheckInterval: number;
  adaptiveHeartbeatEnabled: boolean;
  connectionQualityThreshold: number;
}

import { WebSocket } from 'ws';

export interface ClientSession {
  id: string;
  lastMessageId: bigint;
  connectedAt: Date;
  lastHeartbeat: Date;
  ws: WebSocket;
  isAlive: boolean;
  messageBuffer: Uint8Array[];
  // Enhanced connection quality metrics
  connectionQuality: ConnectionQuality;
  latencyHistory: number[];
  lastPingTime: number;
  missedHeartbeats: number;
  adaptiveHeartbeatInterval: number;
  connectionScore: number;
}

export interface ConnectionQuality {
  latency: number;
  jitter: number;
  packetLoss: number;
  bandwidth: number;
  stability: number;
  lastUpdated: Date;
}

export interface ConnectionQualityMetrics {
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  jitter: number;
  packetLossRate: number;
  connectionStability: number;
  qualityScore: number;
}

export interface MessageHandler {
  (data: Uint8Array, messageId: bigint, timestamp: bigint, session: ClientSession): void;
}

export interface ConnectionHandler {
  (session: ClientSession): void;
}

export interface DisconnectionHandler {
  (session: ClientSession, reason?: string): void;
}

export interface SigmaSocketServerEvents {
  'connection': ConnectionHandler;
  'disconnection': DisconnectionHandler;
  'message': MessageHandler;
  'error': (error: Error) => void;
}

export interface ServerStats {
  totalConnections: number;
  activeConnections: number;
  totalMessages: number;
  uptime: number;
  connectedClients: number;
  messagesSent: bigint;
  messagesReceived: bigint;
  averageLatency: number;
}
