/**
 * Server-specific types for SigmaSockets
 */

import type {
  Message,
  ServerConfig,
  ClientSession,
  PerformanceMetrics,
  // ErrorCode,
} from './common.js';

/**
 * Server configuration interface
 */
export interface SigmaSocketServerConfig extends ServerConfig {
  readonly enableHeartbeat?: boolean;
  readonly enableCompression?: boolean;
  readonly enableMetrics?: boolean;
  readonly maxMessageSize?: number;
  readonly rateLimit?: RateLimitConfig;
  readonly authentication?: AuthenticationConfig;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  readonly messagesPerSecond?: number;
  readonly bytesPerSecond?: number;
  readonly burstLimit?: number;
  readonly windowSize?: number;
}

/**
 * Authentication configuration
 */
export interface AuthenticationConfig {
  readonly required: boolean;
  readonly timeout?: number;
  readonly validator?: (token: string) => Promise<boolean>;
}

/**
 * Server event types
 */
export interface ServerEvents {
  connection: (clientId: string, session: ClientSession) => void;
  disconnection: (clientId: string, reason?: string) => void;
  message: (clientId: string, message: Message) => void;
  error: (error: Error) => void;
  heartbeat: (clientId: string) => void;
  metrics: (metrics: PerformanceMetrics) => void;
}

/**
 * Server interface
 */
export interface SigmaSocketServer {
  /**
   * Start the server
   */
  start(): Promise<void>;

  /**
   * Stop the server
   */
  stop(): void;

  /**
   * Check if server is running
   */
  isRunning(): boolean;

  /**
   * Get connected clients count
   */
  getConnectedClients(): number;

  /**
   * Get all connected client sessions
   */
  getClientSessions(): readonly ClientSession[];

  /**
   * Get specific client session
   */
  getClientSession(clientId: string): ClientSession | null;

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: Message): boolean;

  /**
   * Send data to specific client
   */
  sendToClient(clientId: string, data: Uint8Array): boolean;

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: Message): number;

  /**
   * Broadcast data to all connected clients
   */
  broadcast(data: Uint8Array): number;

  /**
   * Broadcast to specific clients
   */
  broadcastToClients(clientIds: readonly string[], message: Message): number;

  /**
   * Disconnect specific client
   */
  disconnectClient(clientId: string, reason?: string): boolean;

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics;

  /**
   * Register event listener
   */
  on<K extends keyof ServerEvents>(event: K, callback: ServerEvents[K]): void;

  /**
   * Remove event listener
   */
  off<K extends keyof ServerEvents>(event: K, callback: ServerEvents[K]): void;

  /**
   * Emit event (for internal use)
   */
  emit<K extends keyof ServerEvents>(event: K, ...args: Parameters<ServerEvents[K]>): void;

  /**
   * Get server configuration
   */
  getConfig(): SigmaSocketServerConfig;

  /**
   * Update server configuration
   */
  updateConfig(config: Partial<SigmaSocketServerConfig>): void;
}

/**
 * Server factory function type
 */
export type SigmaSocketServerFactory = (config: SigmaSocketServerConfig) => SigmaSocketServer;

/**
 * Server plugin interface
 */
export interface ServerPlugin {
  readonly name: string;
  readonly version: string;
  
  install(server: SigmaSocketServer): void;
  uninstall(server: SigmaSocketServer): void;
}

/**
 * Server middleware interface
 */
export interface ServerMiddleware {
  readonly name: string;
  
  onConnection?(server: SigmaSocketServer, clientId: string, session: ClientSession): boolean;
  onDisconnection?(server: SigmaSocketServer, clientId: string, reason?: string): void;
  onMessage?(server: SigmaSocketServer, clientId: string, message: Message): Message | null;
  onError?(server: SigmaSocketServer, error: Error): void;
}

/**
 * Server state interface
 */
export interface ServerState {
  readonly isRunning: boolean;
  readonly connectedClients: number;
  readonly sessions: readonly ClientSession[];
  readonly metrics: PerformanceMetrics;
  readonly config: SigmaSocketServerConfig;
  readonly plugins: readonly ServerPlugin[];
  readonly middlewares: readonly ServerMiddleware[];
}

/**
 * Server builder interface
 */
export interface ServerBuilder {
  withConfig(config: SigmaSocketServerConfig): ServerBuilder;
  withPlugin(plugin: ServerPlugin): ServerBuilder;
  withMiddleware(middleware: ServerMiddleware): ServerBuilder;
  build(): SigmaSocketServer;
}

/**
 * Server connection options
 */
export interface ServerConnectionOptions {
  readonly timeout?: number;
  readonly keepAlive?: boolean;
  readonly maxConnections?: number;
  readonly compression?: boolean;
}

/**
 * Server message options
 */
export interface ServerMessageOptions {
  readonly priority?: 'low' | 'normal' | 'high';
  readonly compression?: boolean;
  readonly encryption?: boolean;
}

/**
 * Server statistics interface
 */
export interface ServerStatistics {
  readonly totalConnections: number;
  readonly activeConnections: number;
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly bytesSent: number;
  readonly bytesReceived: number;
  readonly uptime: number;
  readonly errorCount: number;
  readonly lastError?: Error;
}

/**
 * Server health check interface
 */
export interface ServerHealthCheck {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly uptime: number;
  readonly memoryUsage: number;
  readonly cpuUsage: number;
  readonly connectionCount: number;
  readonly errorRate: number;
  readonly lastCheck: number;
}

/**
 * Server cluster configuration
 */
export interface ClusterConfig {
  readonly enabled: boolean;
  readonly nodes: readonly string[];
  readonly loadBalancer?: 'round-robin' | 'least-connections' | 'ip-hash';
  readonly healthCheck?: boolean;
  readonly failover?: boolean;
}

/**
 * Server monitoring interface
 */
export interface ServerMonitoring {
  readonly metrics: PerformanceMetrics;
  readonly health: ServerHealthCheck;
  readonly statistics: ServerStatistics;
  readonly alerts: readonly ServerAlert[];
}

/**
 * Server alert interface
 */
export interface ServerAlert {
  readonly id: string;
  readonly type: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly timestamp: number;
  readonly resolved: boolean;
}
