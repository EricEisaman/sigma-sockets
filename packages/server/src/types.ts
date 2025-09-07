export interface SigmaSocketServerConfig {
  port: number;
  host?: string;
  heartbeatInterval?: number;
  sessionTimeout?: number;
  maxConnections?: number;
  bufferSize?: number;
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
