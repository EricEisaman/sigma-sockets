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
}

