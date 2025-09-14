export enum ConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Error = 'error'
}

export interface SigmaSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  sessionTimeout?: number;
  debug?: boolean;
  // Enhanced connection quality settings
  minHeartbeatInterval?: number;
  maxHeartbeatInterval?: number;
  adaptiveHeartbeatEnabled?: boolean;
  connectionQualityMonitoring?: boolean;
}

export interface MessageCallback<T = Uint8Array> {
  (data: T, messageId: bigint, timestamp: bigint): void;
}

export interface ConnectionCallback {
  (status: ConnectionStatus, error?: Error): void;
}

export interface ReconnectionInfo {
  attempt: number;
  maxAttempts: number;
  nextRetryIn: number;
}

export interface SigmaSocketEvents {
  'connection': ConnectionCallback;
  'message': MessageCallback;
  'error': (error: Error) => void;
  'reconnecting': (info: ReconnectionInfo) => void;
}

export interface ClientSession {
  id: string;
  lastMessageId: bigint;
  connectedAt: Date;
  lastHeartbeat: Date;
  // Enhanced connection quality metrics
  connectionQuality?: ConnectionQuality;
  latencyHistory?: number[];
  connectionScore?: number;
  adaptiveHeartbeatInterval?: number;
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

