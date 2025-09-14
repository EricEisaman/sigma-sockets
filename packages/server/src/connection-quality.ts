import type { ClientSession, ConnectionQuality, ConnectionQualityMetrics } from './types';

/**
 * Connection Quality Manager
 * Implements advanced connection quality monitoring and adaptive heartbeat techniques
 * based on research findings from WebSocket performance studies.
 */
export class ConnectionQualityManager {
  private readonly minHeartbeatInterval: number;
  private readonly maxHeartbeatInterval: number;
  private readonly latencyWindowSize: number;
  private readonly qualityThreshold: number;

  constructor(
    minHeartbeatInterval: number = 5000,  // 5 seconds minimum
    maxHeartbeatInterval: number = 60000, // 60 seconds maximum
    latencyWindowSize: number = 10,       // Keep last 10 latency measurements
    qualityThreshold: number = 0.7        // 70% quality threshold
  ) {
    this.minHeartbeatInterval = minHeartbeatInterval;
    this.maxHeartbeatInterval = maxHeartbeatInterval;
    this.latencyWindowSize = latencyWindowSize;
    this.qualityThreshold = qualityThreshold;
  }

  /**
   * Initialize connection quality tracking for a new client session
   */
  initializeClientSession(session: ClientSession): void {
    session.connectionQuality = {
      latency: 0,
      jitter: 0,
      packetLoss: 0,
      bandwidth: 0,
      stability: 1.0,
      lastUpdated: new Date()
    };
    session.latencyHistory = [];
    session.lastPingTime = 0;
    session.missedHeartbeats = 0;
    session.adaptiveHeartbeatInterval = this.minHeartbeatInterval;
    session.connectionScore = 1.0;
  }

  /**
   * Record a ping-pong round trip time for latency calculation
   */
  recordPingPongLatency(session: ClientSession, latency: number): void {
    // Add to latency history
    session.latencyHistory.push(latency);
    
    // Keep only the most recent measurements
    if (session.latencyHistory.length > this.latencyWindowSize) {
      session.latencyHistory.shift();
    }

    // Update connection quality metrics
    this.updateConnectionQuality(session);
    
    // Adjust heartbeat interval based on connection quality
    this.adjustHeartbeatInterval(session);
  }

  /**
   * Record a missed heartbeat
   */
  recordMissedHeartbeat(session: ClientSession): void {
    session.missedHeartbeats++;
    this.updateConnectionQuality(session);
    this.adjustHeartbeatInterval(session);
  }

  /**
   * Reset missed heartbeat counter when heartbeat is received
   */
  resetMissedHeartbeats(session: ClientSession): void {
    session.missedHeartbeats = 0;
    this.updateConnectionQuality(session);
  }

  /**
   * Update connection quality metrics based on current measurements
   */
  private updateConnectionQuality(session: ClientSession): void {
    const now = new Date();
    const quality = session.connectionQuality;

    if (session.latencyHistory.length > 0) {
      // Calculate latency statistics
      const latencies = session.latencyHistory;
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      // const maxLatency = Math.max(...latencies);
      // const minLatency = Math.min(...latencies);
      
      // Calculate jitter (standard deviation of latency)
      const variance = latencies.reduce((sum, lat) => sum + Math.pow(lat - avgLatency, 2), 0) / latencies.length;
      const jitter = Math.sqrt(variance);

      // Calculate packet loss rate based on missed heartbeats
      const totalHeartbeats = session.latencyHistory.length + session.missedHeartbeats;
      const packetLoss = totalHeartbeats > 0 ? session.missedHeartbeats / totalHeartbeats : 0;

      // Calculate connection stability (inverse of jitter and packet loss)
      const stability = Math.max(0, 1 - (jitter / 100) - packetLoss);

      // Update quality metrics
      quality.latency = avgLatency;
      quality.jitter = jitter;
      quality.packetLoss = packetLoss;
      quality.stability = stability;
      quality.lastUpdated = now;

      // Calculate overall connection score (0-1, higher is better)
      session.connectionScore = this.calculateConnectionScore(quality);
    }
  }

  /**
   * Calculate overall connection quality score
   */
  private calculateConnectionScore(quality: ConnectionQuality): number {
    // Weighted scoring based on research findings
    const latencyScore = Math.max(0, 1 - (quality.latency / 1000)); // Penalize latencies > 1s
    const jitterScore = Math.max(0, 1 - (quality.jitter / 500));    // Penalize jitter > 500ms
    const packetLossScore = Math.max(0, 1 - quality.packetLoss);    // Direct penalty for packet loss
    const stabilityScore = quality.stability;                       // Direct stability score

    // Weighted average with emphasis on stability and packet loss
    return (latencyScore * 0.2 + jitterScore * 0.2 + packetLossScore * 0.3 + stabilityScore * 0.3);
  }

  /**
   * Adjust heartbeat interval based on connection quality
   * Implements adaptive heartbeat technique from research
   */
  private adjustHeartbeatInterval(session: ClientSession): void {
    const qualityScore = session.connectionScore;
    
    if (qualityScore >= 0.9) {
      // Excellent connection - use longer intervals
      session.adaptiveHeartbeatInterval = Math.min(
        this.maxHeartbeatInterval,
        session.adaptiveHeartbeatInterval * 1.2
      );
    } else if (qualityScore >= 0.7) {
      // Good connection - maintain current interval
      // No change needed
    } else if (qualityScore >= 0.5) {
      // Poor connection - reduce interval
      session.adaptiveHeartbeatInterval = Math.max(
        this.minHeartbeatInterval,
        session.adaptiveHeartbeatInterval * 0.8
      );
    } else {
      // Very poor connection - use minimum interval
      session.adaptiveHeartbeatInterval = this.minHeartbeatInterval;
    }

    // Ensure interval stays within bounds
    session.adaptiveHeartbeatInterval = Math.max(
      this.minHeartbeatInterval,
      Math.min(this.maxHeartbeatInterval, session.adaptiveHeartbeatInterval)
    );
  }

  /**
   * Get comprehensive connection quality metrics
   */
  getConnectionQualityMetrics(session: ClientSession): ConnectionQualityMetrics {
    const latencies = session.latencyHistory;
    
    if (latencies.length === 0) {
      return {
        averageLatency: 0,
        maxLatency: 0,
        minLatency: 0,
        jitter: 0,
        packetLossRate: 0,
        connectionStability: 1.0,
        qualityScore: 1.0
      };
    }

    const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);
    
    const variance = latencies.reduce((sum, lat) => sum + Math.pow(lat - avgLatency, 2), 0) / latencies.length;
    const jitter = Math.sqrt(variance);

    const totalHeartbeats = latencies.length + session.missedHeartbeats;
    const packetLossRate = totalHeartbeats > 0 ? session.missedHeartbeats / totalHeartbeats : 0;

    return {
      averageLatency: avgLatency,
      maxLatency,
      minLatency,
      jitter,
      packetLossRate,
      connectionStability: session.connectionQuality.stability,
      qualityScore: session.connectionScore
    };
  }

  /**
   * Check if connection quality is below threshold
   */
  isConnectionQualityPoor(session: ClientSession): boolean {
    return session.connectionScore < this.qualityThreshold;
  }

  /**
   * Get recommended action based on connection quality
   */
  getRecommendedAction(session: ClientSession): 'maintain' | 'reduce_interval' | 'disconnect' {
    const score = session.connectionScore;
    
    if (score >= 0.7) {
      return 'maintain';
    } else if (score >= 0.3) {
      return 'reduce_interval';
    } else {
      return 'disconnect';
    }
  }

  /**
   * Get adaptive heartbeat interval for a session
   */
  getAdaptiveHeartbeatInterval(session: ClientSession): number {
    return session.adaptiveHeartbeatInterval;
  }
}
