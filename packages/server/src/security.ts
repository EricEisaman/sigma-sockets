import { IncomingMessage } from 'http';

// Security configuration
export interface SecurityConfig {
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  headers: {
    [key: string]: string;
  };
  ssl: {
    enabled: boolean;
    redirectHttp: boolean;
  };
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  cors: {
    origin: process.env['NODE_ENV'] === 'production' ? [] : '*',
    credentials: false
  },
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: process.env['NODE_ENV'] === 'production' ? 10000 : 1000000 // Very high limit for development/chat demo
  },
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  },
  ssl: {
    enabled: process.env['NODE_ENV'] === 'production',
    redirectHttp: true
  }
};

// Security headers for HTTP responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

export class SecurityManager {
  private config: SecurityConfig;
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: SecurityConfig = defaultSecurityConfig) {
    this.config = config;
    
    // Clean up rate limiting data every minute
    setInterval(() => {
      this.cleanupRateLimits();
    }, 60000);
  }

  /**
   * Validates CORS origin for WebSocket connections
   */
  validateOrigin(origin: string | undefined): boolean {
    if (!this.config.cors.origin) return true;
    
    if (Array.isArray(this.config.cors.origin)) {
      return this.config.cors.origin.includes(origin || '');
    }
    
    return this.config.cors.origin === '*' || this.config.cors.origin === origin;
  }

  /**
   * Checks rate limiting for a client
   */
  checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const clientData = this.rateLimitStore.get(clientId);

    if (!clientData) {
      this.rateLimitStore.set(clientId, { 
        count: 1, 
        resetTime: now + this.config.rateLimit.windowMs 
      });
      return true;
    }

    // Reset counter if time window has passed
    if (now > clientData.resetTime) {
      this.rateLimitStore.set(clientId, { 
        count: 1, 
        resetTime: now + this.config.rateLimit.windowMs 
      });
      return true;
    }

    // Check if within rate limit
    if (clientData.count >= this.config.rateLimit.maxRequests) {
      return false;
    }

    // Increment counter
    clientData.count++;
    return true;
  }

  /**
   * Applies security headers to HTTP response
   */
  applySecurityHeaders(response: any): void {
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.setHeader(key, value);
    });
  }

  /**
   * Validates WebSocket upgrade request
   */
  validateWebSocketUpgrade(request: IncomingMessage): { valid: boolean; error?: string } {
    // Check origin
    const origin = request.headers.origin;
    if (!this.validateOrigin(origin)) {
      return { valid: false, error: 'Invalid origin' };
    }

    // Check user agent (basic bot detection)
    const userAgent = request.headers['user-agent'];
    if (!userAgent || userAgent.length < 10) {
      return { valid: false, error: 'Invalid user agent' };
    }

    // Check for suspicious patterns in user agent
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      return { valid: false, error: 'Suspicious user agent' };
    }

    // Check WebSocket headers
    const upgrade = request.headers.upgrade;
    const connection = request.headers.connection;
    const wsKey = request.headers['sec-websocket-key'];

    if (upgrade !== 'websocket') {
      return { valid: false, error: 'Invalid upgrade header' };
    }

    if (!connection || !connection.toLowerCase().includes('upgrade')) {
      return { valid: false, error: 'Invalid connection header' };
    }

    if (!wsKey || wsKey.length !== 24) {
      return { valid: false, error: 'Invalid WebSocket key' };
    }

    return { valid: true };
  }

  /**
   * Sanitizes client IP address
   */
  sanitizeClientIP(request: IncomingMessage): string {
    const forwarded = request.headers['x-forwarded-for'];
    const realIP = request.headers['x-real-ip'];
    const remoteAddress = request.socket.remoteAddress;

    // Use the first IP in the chain if forwarded
    if (forwarded) {
      const ips = forwarded.toString().split(',');
      return ips[0]?.trim() || 'unknown';
    }

    if (realIP) {
      return realIP.toString();
    }

    return remoteAddress || 'unknown';
  }

  /**
   * Validates message size and content
   */
  validateMessageSize(data: Buffer): { valid: boolean; error?: string } {
    const maxSize = 64 * 1024; // 64KB

    if (data.length === 0) {
      return { valid: false, error: 'Empty message' };
    }

    if (data.length > maxSize) {
      return { valid: false, error: 'Message too large' };
    }

    return { valid: true };
  }

  /**
   * Detects potential DoS attacks
   */
  detectDoSAttack(clientId: string, messageSize: number): boolean {
    const clientData = this.rateLimitStore.get(clientId);

    if (!clientData) return false;

    // Check for rapid large messages
    if (messageSize > 32 * 1024 && clientData.count > 10) {
      return true;
    }

    // Check for rapid connection attempts (increased threshold for chat apps)
    if (clientData.count > 500) {
      return true;
    }

    return false;
  }

  /**
   * Logs security events
   */
  logSecurityEvent(event: string, clientId: string, details?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      clientId,
      details,
      severity: this.getEventSeverity(event)
    };

    // In production, this should go to a proper logging system
    console.warn('SECURITY_EVENT:', JSON.stringify(logEntry));
  }

  /**
   * Gets severity level for security events
   */
  private getEventSeverity(event: string): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityEvents = ['dos_attack', 'invalid_origin', 'rate_limit_exceeded'];
    const mediumSeverityEvents = ['suspicious_user_agent', 'large_message'];
    const lowSeverityEvents = ['connection_attempt'];

    if (highSeverityEvents.includes(event)) return 'high';
    if (mediumSeverityEvents.includes(event)) return 'medium';
    if (lowSeverityEvents.includes(event)) return 'low';
    
    return 'low';
  }

  /**
   * Cleans up old rate limiting data
   */
  private cleanupRateLimits(): void {
    const now = Date.now();
    for (const [clientId, data] of this.rateLimitStore.entries()) {
      if (now > data.resetTime + 300000) { // Clean up after 5 minutes
        this.rateLimitStore.delete(clientId);
      }
    }
  }

  /**
   * Gets current security statistics
   */
  getSecurityStats(): {
    activeClients: number;
    rateLimitedClients: number;
    blockedRequests: number;
  } {
    const now = Date.now();
    let rateLimitedClients = 0;
    let blockedRequests = 0;

    for (const [_, data] of this.rateLimitStore.entries()) {
      if (now <= data.resetTime) {
        if (data.count >= this.config.rateLimit.maxRequests) {
          rateLimitedClients++;
        }
        blockedRequests += Math.max(0, data.count - this.config.rateLimit.maxRequests);
      }
    }

    return {
      activeClients: this.rateLimitStore.size,
      rateLimitedClients,
      blockedRequests
    };
  }
}

/**
 * Utility function to create a secure WebSocket server configuration
 */
export function createSecureWebSocketConfig(securityConfig: SecurityConfig) {
  return {
    perMessageDeflate: false, // Disable compression for security
    maxPayload: 64 * 1024, // 64KB max payload
    verifyClient: (info: any) => {
      const securityManager = new SecurityManager(securityConfig);
      const validation = securityManager.validateWebSocketUpgrade(info.req);
      
      if (!validation.valid) {
        securityManager.logSecurityEvent('invalid_upgrade', 'unknown', validation.error);
        return false;
      }

      return true;
    }
  };
}
