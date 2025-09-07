/**
 * Client-specific types for SigmaSockets
 */

import type {
  ConnectionStatus,
  Message,
  ConnectionConfig,
  ClientSession,
  ConnectionCallback,
  MessageCallback,
  ErrorCallback,
  ReconnectingCallback,
  PerformanceMetrics,
} from './common.js';

/**
 * Client configuration interface
 */
export interface SigmaSocketClientConfig extends ConnectionConfig {
  readonly autoConnect?: boolean;
  readonly enableHeartbeat?: boolean;
  readonly enableReconnection?: boolean;
  readonly bufferSize?: number;
  readonly compression?: boolean;
}

/**
 * Client event types
 */
export interface ClientEvents {
  connection: ConnectionCallback;
  message: MessageCallback;
  error: ErrorCallback;
  reconnecting: ReconnectingCallback;
  heartbeat: () => void;
  session: (session: ClientSession | null) => void;
}

/**
 * Client interface
 */
export interface SigmaSocketClient {
  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the server
   */
  disconnect(): void;

  /**
   * Send data to the server
   */
  send(data: Uint8Array): boolean;

  /**
   * Send a message to the server
   */
  sendMessage(message: Message): boolean;

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus;

  /**
   * Get current session information
   */
  getSession(): ClientSession | null;

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics;

  /**
   * Register event listener
   */
  on<K extends keyof ClientEvents>(event: K, callback: ClientEvents[K]): void;

  /**
   * Remove event listener
   */
  off<K extends keyof ClientEvents>(event: K, callback: ClientEvents[K]): void;

  /**
   * Emit event (for internal use)
   */
  emit<K extends keyof ClientEvents>(event: K, ...args: Parameters<ClientEvents[K]>): void;

  /**
   * Check if client is connected
   */
  isConnected(): boolean;

  /**
   * Get connection URL
   */
  getUrl(): string;

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SigmaSocketClientConfig>): void;
}

/**
 * Client factory function type
 */
export type SigmaSocketClientFactory = (config: SigmaSocketClientConfig) => SigmaSocketClient;

/**
 * Client plugin interface
 */
export interface ClientPlugin {
  readonly name: string;
  readonly version: string;
  
  install(client: SigmaSocketClient): void;
  uninstall(client: SigmaSocketClient): void;
}

/**
 * Client middleware interface
 */
export interface ClientMiddleware {
  readonly name: string;
  
  onConnect?(client: SigmaSocketClient): void;
  onDisconnect?(client: SigmaSocketClient): void;
  onMessage?(client: SigmaSocketClient, message: Message): Message | null;
  onError?(client: SigmaSocketClient, error: Error): void;
}

/**
 * Client state interface
 */
export interface ClientState {
  readonly status: ConnectionStatus;
  readonly session: ClientSession | null;
  readonly metrics: PerformanceMetrics;
  readonly config: SigmaSocketClientConfig;
  readonly plugins: readonly ClientPlugin[];
  readonly middlewares: readonly ClientMiddleware[];
}

/**
 * Client builder interface
 */
export interface ClientBuilder {
  withConfig(config: SigmaSocketClientConfig): ClientBuilder;
  withPlugin(plugin: ClientPlugin): ClientBuilder;
  withMiddleware(middleware: ClientMiddleware): ClientBuilder;
  build(): SigmaSocketClient;
}

/**
 * Client connection options
 */
export interface ConnectionOptions {
  readonly timeout?: number;
  readonly retries?: number;
  readonly backoff?: 'linear' | 'exponential';
  readonly maxBackoff?: number;
}

/**
 * Client message options
 */
export interface MessageOptions {
  readonly priority?: 'low' | 'normal' | 'high';
  readonly timeout?: number;
  readonly retries?: number;
  readonly compression?: boolean;
}

/**
 * Client statistics interface
 */
export interface ClientStatistics {
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly bytesSent: number;
  readonly bytesReceived: number;
  readonly connectionTime: number;
  readonly reconnectionCount: number;
  readonly errorCount: number;
  readonly lastError?: Error;
}
