import { WebSocket } from 'ws';
import type { ClientSession } from './types';

/**
 * Persistent Connection Manager
 * Implements insights from Mogul's "The Case for Persistent-Connection HTTP"
 * to optimize WebSocket connection reuse and resource utilization.
 */
export class PersistentConnectionManager {
  private readonly maxConnections: number;
  private readonly defaultIdleTimeout: number;
  private readonly adaptiveTimeoutEnabled: boolean;
  private readonly lruEnabled: boolean;
  
  private connectionPool: Map<string, PersistentConnection> = new Map();
  private clientBehaviorMap: Map<string, ClientBehaviorProfile> = new Map();
  private connectionStats: ConnectionPoolStatistics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    reusedConnections: 0,
    forcedCloses: 0,
    timeoutCloses: 0,
    totalRequests: 0,
    connectionHits: 0
  };

  constructor(
    maxConnections: number = 1000,
    defaultIdleTimeout: number = 120000, // 2 minutes
    adaptiveTimeoutEnabled: boolean = true,
    lruEnabled: boolean = true
  ) {
    this.maxConnections = maxConnections;
    this.defaultIdleTimeout = defaultIdleTimeout;
    this.adaptiveTimeoutEnabled = adaptiveTimeoutEnabled;
    this.lruEnabled = lruEnabled;
  }

  /**
   * Attempt to reuse existing connection or create new one
   * Based on Mogul's locality of reference findings
   */
  acquireConnection(clientId: string, ws: WebSocket, session: ClientSession): ConnectionAcquisitionResult {
    this.connectionStats.totalRequests++;

    // Check for existing connection to this client
    const existingConnection = this.connectionPool.get(clientId);
    
    if (existingConnection && existingConnection.isActive) {
      // Connection hit - reuse existing connection
      this.connectionStats.connectionHits++;
      this.connectionStats.reusedConnections++;
      
      // Update connection activity
      existingConnection.lastActivity = Date.now();
      existingConnection.requestCount++;
      existingConnection.isIdle = false;
      
      // Update client behavior profile
      this.updateClientBehavior(clientId, 'connection_reuse');
      
      return {
        success: true,
        connection: existingConnection,
        action: 'reused',
        hitRate: this.calculateHitRate()
      };
    }

    // Need to create new connection
    return this.createNewConnection(clientId, ws, session);
  }

  /**
   * Create new connection with resource management
   */
  private createNewConnection(clientId: string, ws: WebSocket, session: ClientSession): ConnectionAcquisitionResult {
    // Check if we need to free up resources
    if (this.connectionPool.size >= this.maxConnections) {
      const freedConnection = this.freeUpConnection();
      if (!freedConnection) {
        return {
          success: false,
          reason: 'Connection pool full and no idle connections to close',
          hitRate: this.calculateHitRate()
        };
      }
    }

    // Create new persistent connection
    const connection: PersistentConnection = {
      clientId,
      ws,
      session,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      requestCount: 1,
      isActive: true,
      isIdle: false,
      idleTimeout: this.getAdaptiveTimeout(clientId),
      lruTimestamp: Date.now()
    };

    this.connectionPool.set(clientId, connection);
    this.connectionStats.totalConnections++;
    this.connectionStats.activeConnections++;

    // Update client behavior profile
    this.updateClientBehavior(clientId, 'new_connection');

    return {
      success: true,
      connection,
      action: 'created',
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Free up connection using LRU policy
   * Based on Mogul's findings on connection management
   */
  private freeUpConnection(): PersistentConnection | null {
    if (!this.lruEnabled) {
      return null;
    }

    // Find least recently used idle connection
    let lruConnection: PersistentConnection | null = null;
    let oldestTimestamp = Date.now();

    for (const connection of this.connectionPool.values()) {
      if (connection.isIdle && connection.lruTimestamp < oldestTimestamp) {
        lruConnection = connection;
        oldestTimestamp = connection.lruTimestamp;
      }
    }

    if (lruConnection) {
      this.closeConnection(lruConnection.clientId, 'forced_close');
      this.connectionStats.forcedCloses++;
      return lruConnection;
    }

    return null;
  }

  /**
   * Mark connection as idle and start timeout monitoring
   */
  markConnectionIdle(clientId: string): void {
    const connection = this.connectionPool.get(clientId);
    if (!connection) return;

    connection.isIdle = true;
    connection.lruTimestamp = Date.now();
    this.connectionStats.activeConnections--;
    this.connectionStats.idleConnections++;

    // Start timeout monitoring
    this.scheduleConnectionTimeout(clientId, connection.idleTimeout);
  }

  /**
   * Schedule connection timeout based on adaptive strategy
   */
  private scheduleConnectionTimeout(clientId: string, timeout: number): void {
    setTimeout(() => {
      const connection = this.connectionPool.get(clientId);
      if (connection && connection.isIdle) {
        this.closeConnection(clientId, 'timeout');
        this.connectionStats.timeoutCloses++;
      }
    }, timeout);
  }

  /**
   * Close connection and clean up resources
   */
  closeConnection(clientId: string, reason: 'timeout' | 'forced_close' | 'client_disconnect'): void {
    const connection = this.connectionPool.get(clientId);
    if (!connection) return;

    // Close WebSocket if still open
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.close(1000, reason);
    }

    // Remove from pool
    this.connectionPool.delete(clientId);
    
    // Update statistics
    if (connection.isIdle) {
      this.connectionStats.idleConnections--;
    } else {
      this.connectionStats.activeConnections--;
    }

    console.log(`🔧 [PERSISTENT] Connection closed for ${clientId}: ${reason}`);
  }

  /**
   * Get adaptive timeout based on client behavior
   * Implements Mogul's adaptive timeout strategy
   */
  private getAdaptiveTimeout(clientId: string): number {
    if (!this.adaptiveTimeoutEnabled) {
      return this.defaultIdleTimeout;
    }

    const behavior = this.clientBehaviorMap.get(clientId);
    if (!behavior) {
      // New client - use conservative timeout
      return Math.min(this.defaultIdleTimeout, 10000); // 10 seconds
    }

    // Adjust timeout based on client behavior
    if (behavior.connectionReuseRate > 0.8) {
      // High reuse rate - use longer timeout
      return Math.min(this.defaultIdleTimeout * 2, 300000); // Up to 5 minutes
    } else if (behavior.connectionReuseRate > 0.5) {
      // Medium reuse rate - use default timeout
      return this.defaultIdleTimeout;
    } else {
      // Low reuse rate - use shorter timeout
      return Math.min(this.defaultIdleTimeout / 2, 30000); // At least 30 seconds
    }
  }

  /**
   * Update client behavior profile
   */
  private updateClientBehavior(clientId: string, action: 'new_connection' | 'connection_reuse'): void {
    let behavior = this.clientBehaviorMap.get(clientId);
    
    if (!behavior) {
      behavior = {
        clientId,
        totalConnections: 0,
        totalRequests: 0,
        connectionReuseRate: 0,
        averageSessionDuration: 0,
        lastSeen: Date.now(),
        behaviorScore: 0.5
      };
      this.clientBehaviorMap.set(clientId, behavior);
    }

    behavior.lastSeen = Date.now();
    behavior.totalRequests++;

    if (action === 'new_connection') {
      behavior.totalConnections++;
    }

    // Calculate connection reuse rate
    if (behavior.totalConnections > 0) {
      behavior.connectionReuseRate = (behavior.totalRequests - behavior.totalConnections) / behavior.totalRequests;
    }

    // Calculate behavior score (0-1, higher is better for connection reuse)
    behavior.behaviorScore = this.calculateBehaviorScore(behavior);
  }

  /**
   * Calculate behavior score for connection optimization
   */
  private calculateBehaviorScore(behavior: ClientBehaviorProfile): number {
    const reuseWeight = 0.6;
    const frequencyWeight = 0.3;
    const recencyWeight = 0.1;

    const reuseScore = behavior.connectionReuseRate;
    const frequencyScore = Math.min(behavior.totalRequests / 100, 1); // Normalize to 100 requests
    const recencyScore = Math.max(0, 1 - (Date.now() - behavior.lastSeen) / 86400000); // Decay over 24 hours

    return (reuseScore * reuseWeight + frequencyScore * frequencyWeight + recencyScore * recencyWeight);
  }

  /**
   * Calculate connection hit rate
   */
  private calculateHitRate(): number {
    if (this.connectionStats.totalRequests === 0) return 0;
    return this.connectionStats.connectionHits / this.connectionStats.totalRequests;
  }

  /**
   * Get connection pool statistics
   */
  getStatistics(): ConnectionPoolStatistics {
    return {
      ...this.connectionStats,
      hitRate: this.calculateHitRate(),
      poolUtilization: (this.connectionPool.size / this.maxConnections) * 100,
      averageRequestsPerConnection: this.connectionPool.size > 0 
        ? this.connectionStats.totalRequests / this.connectionPool.size 
        : 0
    };
  }

  /**
   * Get client behavior insights
   */
  getClientBehaviorInsights(): ClientBehaviorInsights {
    const behaviors = Array.from(this.clientBehaviorMap.values());
    
    if (behaviors.length === 0) {
      return {
        totalClients: 0,
        averageReuseRate: 0,
        highReuseClients: 0,
        lowReuseClients: 0,
        topClients: []
      };
    }

    const averageReuseRate = behaviors.reduce((sum, b) => sum + b.connectionReuseRate, 0) / behaviors.length;
    const highReuseClients = behaviors.filter(b => b.connectionReuseRate > 0.7).length;
    const lowReuseClients = behaviors.filter(b => b.connectionReuseRate < 0.3).length;

    // Get top clients by behavior score
    const topClients = behaviors
      .sort((a, b) => b.behaviorScore - a.behaviorScore)
      .slice(0, 10)
      .map(b => ({
        clientId: b.clientId,
        behaviorScore: b.behaviorScore,
        reuseRate: b.connectionReuseRate,
        totalRequests: b.totalRequests
      }));

    return {
      totalClients: behaviors.length,
      averageReuseRate,
      highReuseClients,
      lowReuseClients,
      topClients
    };
  }

  /**
   * Optimize connection pool based on current usage patterns
   */
  optimizeConnectionPool(): OptimizationRecommendations {
    const stats = this.getStatistics();
    const insights = this.getClientBehaviorInsights();
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Analyze hit rate
    if (stats.hitRate && stats.hitRate < 0.5) {
      warnings.push('Low connection hit rate - consider increasing idle timeout');
      recommendations.push('Increase defaultIdleTimeout to improve connection reuse');
    } else if (stats.hitRate && stats.hitRate > 0.9) {
      recommendations.push('Excellent hit rate - consider reducing idle timeout to free resources');
    }

    // Analyze pool utilization
    if (stats.poolUtilization && stats.poolUtilization > 90) {
      warnings.push('Connection pool near capacity');
      recommendations.push('Consider increasing maxConnections or reducing idle timeout');
    } else if (stats.poolUtilization && stats.poolUtilization < 30) {
      recommendations.push('Low pool utilization - could increase maxConnections for better performance');
    }

    // Analyze client behavior
    if (insights.lowReuseClients > insights.highReuseClients) {
      recommendations.push('Many clients show low connection reuse - consider shorter idle timeouts');
    }

    return {
      recommendations,
      warnings,
      currentHitRate: stats.hitRate || 0,
      poolUtilization: stats.poolUtilization || 0,
      optimizationScore: this.calculateOptimizationScore(stats, insights)
    };
  }

  /**
   * Calculate overall optimization score
   */
  private calculateOptimizationScore(stats: ConnectionPoolStatistics, insights: ClientBehaviorInsights): number {
    const hitRateScore = Math.min((stats.hitRate || 0) * 2, 1); // Hit rate up to 50% gets full score
    const utilizationScore = (stats.poolUtilization || 0) > 50 && (stats.poolUtilization || 0) < 90 ? 1 : 0.5;
    const behaviorScore = insights.averageReuseRate;
    
    return (hitRateScore * 0.4 + utilizationScore * 0.3 + behaviorScore * 0.3);
  }

  /**
   * Clean up old client behavior data
   */
  cleanupOldBehaviorData(maxAge: number = 86400000): void { // 24 hours
    const cutoff = Date.now() - maxAge;
    
    for (const [clientId, behavior] of this.clientBehaviorMap.entries()) {
      if (behavior.lastSeen < cutoff) {
        this.clientBehaviorMap.delete(clientId);
      }
    }
  }
}

// Type definitions
export interface PersistentConnection {
  clientId: string;
  ws: WebSocket;
  session: ClientSession;
  createdAt: number;
  lastActivity: number;
  requestCount: number;
  isActive: boolean;
  isIdle: boolean;
  idleTimeout: number;
  lruTimestamp: number;
}

export interface ClientBehaviorProfile {
  clientId: string;
  totalConnections: number;
  totalRequests: number;
  connectionReuseRate: number;
  averageSessionDuration: number;
  lastSeen: number;
  behaviorScore: number;
}

export interface ConnectionPoolStatistics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  reusedConnections: number;
  forcedCloses: number;
  timeoutCloses: number;
  totalRequests: number;
  connectionHits: number;
  hitRate?: number;
  poolUtilization?: number;
  averageRequestsPerConnection?: number;
}

export interface ConnectionAcquisitionResult {
  success: boolean;
  connection?: PersistentConnection;
  action?: 'created' | 'reused';
  reason?: string;
  hitRate: number;
}

export interface ClientBehaviorInsights {
  totalClients: number;
  averageReuseRate: number;
  highReuseClients: number;
  lowReuseClients: number;
  topClients: Array<{
    clientId: string;
    behaviorScore: number;
    reuseRate: number;
    totalRequests: number;
  }>;
}

export interface OptimizationRecommendations {
  recommendations: string[];
  warnings: string[];
  currentHitRate: number;
  poolUtilization: number;
  optimizationScore: number;
}
