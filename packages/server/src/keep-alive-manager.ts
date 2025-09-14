import { WebSocket } from 'ws';

/**
 * Advanced Keep-Alive Manager
 * Implements insights from Kamailio WebSocket discussion and real-world
 * production experience with load balancers and NAT traversal.
 */
export class KeepAliveManager {
  private readonly defaultPingInterval: number;
  private readonly maxIdleTime: number;
  private readonly loadBalancerTimeout: number;
  private readonly tcpKeepAliveEnabled: boolean;
  private readonly idleConnectionPingEnabled: boolean;
  
  private pingTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastActivityTimers: Map<string, number> = new Map();
  private connectionStates: Map<string, ConnectionState> = new Map();

  constructor(
    defaultPingInterval: number = 30000,  // 30 seconds
    maxIdleTime: number = 55000,          // 55 seconds (less than ELB timeout)
    loadBalancerTimeout: number = 60000,  // 60 seconds (Amazon ELB default)
    tcpKeepAliveEnabled: boolean = true,
    idleConnectionPingEnabled: boolean = true
  ) {
    this.defaultPingInterval = defaultPingInterval;
    this.maxIdleTime = maxIdleTime;
    this.loadBalancerTimeout = loadBalancerTimeout;
    this.tcpKeepAliveEnabled = tcpKeepAliveEnabled;
    this.idleConnectionPingEnabled = idleConnectionPingEnabled;
  }

  /**
   * Initialize keep-alive for a new connection
   * Based on Kamailio insights about idle connection detection
   */
  initializeConnection(sessionId: string, ws: WebSocket): void {
    const now = Date.now();
    
    // Record initial activity
    this.lastActivityTimers.set(sessionId, now);
    
    // Initialize connection state
    this.connectionStates.set(sessionId, {
      isIdle: false,
      lastPingSent: 0,
      lastPongReceived: 0,
      consecutiveMissedPongs: 0,
      totalPingsSent: 0,
      totalPongsReceived: 0
    });

    // Configure TCP keep-alive if enabled
    if (this.tcpKeepAliveEnabled) {
      this.configureTcpKeepAlive(ws);
    }

    // Start idle connection monitoring
    if (this.idleConnectionPingEnabled) {
      this.startIdleConnectionMonitoring(sessionId, ws);
    }

    console.log(`🔧 [KEEP-ALIVE] Initialized for session ${sessionId}`);
  }

  /**
   * Record activity on connection to update idle state
   */
  recordActivity(sessionId: string): void {
    const now = Date.now();
    this.lastActivityTimers.set(sessionId, now);
    
    const state = this.connectionStates.get(sessionId);
    if (state) {
      state.isIdle = false;
    }
  }

  /**
   * Handle incoming pong frame
   */
  handlePong(sessionId: string): void {
    const now = Date.now();
    const state = this.connectionStates.get(sessionId);
    
    if (state) {
      state.lastPongReceived = now;
      state.consecutiveMissedPongs = 0;
      state.totalPongsReceived++;
      state.isIdle = false;
    }

    // Update activity timestamp
    this.recordActivity(sessionId);
    
    console.log(`🔧 [KEEP-ALIVE] Pong received from ${sessionId}`);
  }

  /**
   * Send ping to idle connection
   * Implements Kamailio's approach of pinging idle connections
   */
  private sendIdlePing(sessionId: string, ws: WebSocket): void {
    if (ws.readyState !== WebSocket.OPEN) {
      this.cleanupConnection(sessionId);
      return;
    }

    const state = this.connectionStates.get(sessionId);
    if (!state) return;

    const now = Date.now();
    const timeSinceLastActivity = now - (this.lastActivityTimers.get(sessionId) || now);
    
    // Only ping if connection has been idle
    if (timeSinceLastActivity >= this.maxIdleTime) {
      state.isIdle = true;
      state.lastPingSent = now;
      state.totalPingsSent++;
      
      try {
        ws.ping();
        console.log(`🔧 [KEEP-ALIVE] Ping sent to idle connection ${sessionId}`);
      } catch (error) {
        console.error(`🔧 [KEEP-ALIVE] Failed to send ping to ${sessionId}:`, error);
        this.cleanupConnection(sessionId);
      }
    }
  }

  /**
   * Start monitoring for idle connections
   */
  private startIdleConnectionMonitoring(sessionId: string, ws: WebSocket): void {
    // Clear any existing timer
    this.clearPingTimer(sessionId);

    const timer = setInterval(() => {
      this.sendIdlePing(sessionId, ws);
    }, this.defaultPingInterval);

    this.pingTimers.set(sessionId, timer);
  }

  /**
   * Configure TCP keep-alive settings
   * Based on Kamailio discussion about TCP vs WebSocket layer keep-alive
   */
  private configureTcpKeepAlive(ws: WebSocket): void {
    try {
      // Configure TCP keep-alive parameters
      // These are OS-level settings that help with NAT traversal
      const socket = (ws as any)._socket;
      if (socket) {
        socket.setKeepAlive(true, 1000); // Enable keep-alive, start after 1 second
        socket.setNoDelay(true); // Disable Nagle's algorithm for lower latency
      }
    } catch (error) {
      console.warn('🔧 [KEEP-ALIVE] Could not configure TCP keep-alive:', error);
    }
  }

  /**
   * Check for missed pongs and handle connection health
   */
  checkConnectionHealth(sessionId: string): ConnectionHealthStatus {
    const state = this.connectionStates.get(sessionId);
    if (!state) {
      return { status: 'unknown', shouldDisconnect: true };
    }

    const now = Date.now();
    const timeSinceLastPing = now - state.lastPingSent;
    const timeSinceLastPong = now - state.lastPongReceived;

    // If we've sent a ping but haven't received a pong in reasonable time
    if (state.lastPingSent > 0 && timeSinceLastPing > 10000 && timeSinceLastPong > 10000) {
      state.consecutiveMissedPongs++;
      
      if (state.consecutiveMissedPongs >= 3) {
        return { 
          status: 'unhealthy', 
          shouldDisconnect: true,
          reason: 'Multiple missed pongs'
        };
      }
      
      return { 
        status: 'degraded', 
        shouldDisconnect: false,
        reason: 'Missed pong response'
      };
    }

    // Check if connection is approaching load balancer timeout
    const timeSinceLastActivity = now - (this.lastActivityTimers.get(sessionId) || now);
    if (timeSinceLastActivity > this.loadBalancerTimeout - 5000) {
      return { 
        status: 'at_risk', 
        shouldDisconnect: false,
        reason: 'Approaching load balancer timeout'
      };
    }

    return { 
      status: 'healthy', 
      shouldDisconnect: false 
    };
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(sessionId: string): ConnectionStats | null {
    const state = this.connectionStates.get(sessionId);
    if (!state) return null;

    const lastActivity = this.lastActivityTimers.get(sessionId) || 0;
    const now = Date.now();

    return {
      sessionId,
      isIdle: state.isIdle,
      timeSinceLastActivity: now - lastActivity,
      totalPingsSent: state.totalPingsSent,
      totalPongsReceived: state.totalPongsReceived,
      consecutiveMissedPongs: state.consecutiveMissedPongs,
      lastPingSent: state.lastPingSent,
      lastPongReceived: state.lastPongReceived,
      pingPongRatio: state.totalPingsSent > 0 ? state.totalPongsReceived / state.totalPingsSent : 1
    };
  }

  /**
   * Get all connection statistics
   */
  getAllConnectionStats(): Map<string, ConnectionStats> {
    const stats = new Map<string, ConnectionStats>();
    
    for (const sessionId of this.connectionStates.keys()) {
      const stat = this.getConnectionStats(sessionId);
      if (stat) {
        stats.set(sessionId, stat);
      }
    }
    
    return stats;
  }

  /**
   * Update ping interval for a specific connection
   * Useful for adaptive keep-alive based on connection quality
   */
  updatePingInterval(sessionId: string, newInterval: number): void {
    const state = this.connectionStates.get(sessionId);
    if (!state) return;

    // Clear existing timer
    this.clearPingTimer(sessionId);

    // Start new timer with updated interval
    const ws = this.getWebSocketForSession(sessionId);
    if (ws) {
      const timer = setInterval(() => {
        this.sendIdlePing(sessionId, ws);
      }, newInterval);

      this.pingTimers.set(sessionId, timer);
      console.log(`🔧 [KEEP-ALIVE] Updated ping interval for ${sessionId} to ${newInterval}ms`);
    }
  }

  /**
   * Clean up connection resources
   */
  cleanupConnection(sessionId: string): void {
    this.clearPingTimer(sessionId);
    this.lastActivityTimers.delete(sessionId);
    this.connectionStates.delete(sessionId);
    
    console.log(`🔧 [KEEP-ALIVE] Cleaned up connection ${sessionId}`);
  }

  /**
   * Clear ping timer for a session
   */
  private clearPingTimer(sessionId: string): void {
    const timer = this.pingTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.pingTimers.delete(sessionId);
    }
  }

  /**
   * Get WebSocket for session (this would need to be injected or retrieved from parent)
   */
  private getWebSocketForSession(_sessionId: string): WebSocket | null {
    // This is a placeholder - in real implementation, this would be injected
    // or retrieved from the parent server instance
    return null;
  }

  /**
   * Get keep-alive configuration summary
   */
  getConfiguration(): KeepAliveConfiguration {
    return {
      defaultPingInterval: this.defaultPingInterval,
      maxIdleTime: this.maxIdleTime,
      loadBalancerTimeout: this.loadBalancerTimeout,
      tcpKeepAliveEnabled: this.tcpKeepAliveEnabled,
      idleConnectionPingEnabled: this.idleConnectionPingEnabled,
      activeConnections: this.connectionStates.size
    };
  }

  /**
   * Validate keep-alive configuration against known constraints
   */
  validateConfiguration(): ConfigurationValidation {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check against load balancer timeout
    if (this.maxIdleTime >= this.loadBalancerTimeout) {
      warnings.push('Max idle time is greater than or equal to load balancer timeout');
      recommendations.push('Set max idle time to be at least 5 seconds less than load balancer timeout');
    }

    // Check ping interval
    if (this.defaultPingInterval > this.maxIdleTime) {
      warnings.push('Ping interval is greater than max idle time');
      recommendations.push('Set ping interval to be less than max idle time');
    }

    // Check for very short intervals
    if (this.defaultPingInterval < 5000) {
      warnings.push('Very short ping interval may cause excessive network traffic');
      recommendations.push('Consider using ping interval of at least 5 seconds');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations
    };
  }
}

// Type definitions
export interface ConnectionState {
  isIdle: boolean;
  lastPingSent: number;
  lastPongReceived: number;
  consecutiveMissedPongs: number;
  totalPingsSent: number;
  totalPongsReceived: number;
}

export interface ConnectionHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'at_risk' | 'unknown';
  shouldDisconnect: boolean;
  reason?: string;
}

export interface ConnectionStats {
  sessionId: string;
  isIdle: boolean;
  timeSinceLastActivity: number;
  totalPingsSent: number;
  totalPongsReceived: number;
  consecutiveMissedPongs: number;
  lastPingSent: number;
  lastPongReceived: number;
  pingPongRatio: number;
}

export interface KeepAliveConfiguration {
  defaultPingInterval: number;
  maxIdleTime: number;
  loadBalancerTimeout: number;
  tcpKeepAliveEnabled: boolean;
  idleConnectionPingEnabled: boolean;
  activeConnections: number;
}

export interface ConfigurationValidation {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
}
