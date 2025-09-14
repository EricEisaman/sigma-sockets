/**
 * Environment Configuration
 * 
 * This file provides environment-based configuration for both
 * development and production deployments.
 */

export const envConfig = {
  // Environment detection
  isDev: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev',
  isProd: process.env.NODE_ENV === 'production',
  
  // Port configuration
  httpPort: process.env.NODE_ENV === 'development' 
    ? parseInt(process.env.WS_PORT || '3002')
    : parseInt(process.env.PORT || '10000'),
    
  wsPort: process.env.NODE_ENV === 'development'
    ? parseInt(process.env.WS_PORT || '3002')
    : parseInt(process.env.PORT || '10000'),
    
  // WebSocket URL configuration
  wsUrl: process.env.NODE_ENV === 'production'
    ? `wss://${process.env.HOST || 'localhost'}:${process.env.PORT || '10000'}`
    : `ws://localhost:${process.env.WS_PORT || '3002'}`,
    
  // Debug configuration
  debug: process.env.NODE_ENV === 'development' || process.env.VITE_DEBUG === 'true',
  
  // Security configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Server configuration
  host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info')
};

export default envConfig;
