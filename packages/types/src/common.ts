/**
 * Common types shared between SigmaSockets client and server
 */

/**
 * Connection status enumeration
 */
export enum ConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Error = 'error',
}

/**
 * Message types for WebSocket communication
 */
export enum MessageType {
  Data = 'data',
  Heartbeat = 'heartbeat',
  Connection = 'connection',
  Disconnection = 'disconnection',
  Error = 'error',
}

/**
 * Base message interface
 */
export interface BaseMessage {
  readonly type: MessageType;
  readonly id: string;
  readonly timestamp: number;
}

/**
 * Data message interface
 */
export interface DataMessage extends BaseMessage {
  readonly type: MessageType.Data;
  readonly payload: Uint8Array;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Heartbeat message interface
 */
export interface HeartbeatMessage extends BaseMessage {
  readonly type: MessageType.Heartbeat;
  readonly clientId: string;
}

/**
 * Connection message interface
 */
export interface ConnectionMessage extends BaseMessage {
  readonly type: MessageType.Connection;
  readonly clientId: string;
  readonly sessionId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Disconnection message interface
 */
export interface DisconnectionMessage extends BaseMessage {
  readonly type: MessageType.Disconnection;
  readonly clientId: string;
  readonly reason?: string;
}

/**
 * Error message interface
 */
export interface ErrorMessage extends BaseMessage {
  readonly type: MessageType.Error;
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Union type for all message types
 */
export type Message = 
  | DataMessage 
  | HeartbeatMessage 
  | ConnectionMessage 
  | DisconnectionMessage 
  | ErrorMessage;

/**
 * Client session information
 */
export interface ClientSession {
  readonly id: string;
  readonly connectedAt: number;
  readonly lastSeen: number;
  readonly metadata?: Record<string, unknown>;
  readonly ws: WebSocket;
  isAlive: boolean;
  messageBuffer: Uint8Array[];
}

/**
 * Connection configuration interface
 */
export interface ConnectionConfig {
  readonly url: string;
  readonly reconnectInterval?: number;
  readonly maxReconnectAttempts?: number;
  readonly heartbeatInterval?: number;
  readonly sessionTimeout?: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Server configuration interface
 */
export interface ServerConfig {
  readonly port: number;
  readonly host?: string;
  readonly heartbeatInterval?: number;
  readonly sessionTimeout?: number;
  readonly maxConnections?: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Event callback types
 */
export type ConnectionCallback = (status: ConnectionStatus) => void;
export type MessageCallback = (message: Message) => void;
export type ErrorCallback = (error: Error) => void;
export type ReconnectingCallback = (info: ReconnectingInfo) => void;

/**
 * Reconnecting information interface
 */
export interface ReconnectingInfo {
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly nextRetryIn: number;
  readonly lastError?: Error;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  readonly messagesPerSecond: number;
  readonly averageLatency: number;
  readonly connectionCount: number;
  readonly memoryUsage: number;
  readonly cpuUsage: number;
}

/**
 * FlatBuffer message interface
 */
export interface FlatBufferMessage {
  readonly id: bigint;
  readonly timestamp: bigint;
  readonly payload: Uint8Array;
  readonly type: MessageType;
}

/**
 * Error codes enumeration
 */
export enum ErrorCode {
  ConnectionFailed = 'CONNECTION_FAILED',
  AuthenticationFailed = 'AUTHENTICATION_FAILED',
  SessionExpired = 'SESSION_EXPIRED',
  MessageTooLarge = 'MESSAGE_TOO_LARGE',
  RateLimitExceeded = 'RATE_LIMIT_EXCEEDED',
  ServerError = 'SERVER_ERROR',
  ClientError = 'CLIENT_ERROR',
  NetworkError = 'NETWORK_ERROR',
  TimeoutError = 'TIMEOUT_ERROR',
  UnknownError = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for SigmaSockets
 */
export class SigmaSocketError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'SigmaSocketError';
    this.code = code;
    this.details = details ?? {};
  }
}
