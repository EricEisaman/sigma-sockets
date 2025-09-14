/**
 * Deployment Configuration
 * 
 * This file provides deployment-specific configuration for different environments.
 */

export const deploymentConfig = {
  // Development configuration
  development: {
    NODE_ENV: 'development',
    WS_PORT: '3002',
    VITE_WS_PORT: '3002',
    VITE_DEBUG: 'true',
    HOST: 'localhost',
    CORS_ORIGIN: '*',
    LOG_LEVEL: 'debug'
  },
  
  // Production configuration
  production: {
    NODE_ENV: 'production',
    PORT: process.env.PORT || '10000',
    HOST: process.env.HOST || '0.0.0.0',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    LOG_LEVEL: 'info',
    SIGMASOCKETS_HEARTBEAT_INTERVAL: '30000',
    SIGMASOCKETS_SESSION_TIMEOUT: '300000',
    SIGMASOCKETS_MAX_CONNECTIONS: '1000'
  },
  
  // Render.com specific configuration
  render: {
    NODE_ENV: 'production',
    PORT: process.env.PORT || '10000',
    HOST: '0.0.0.0',
    CORS_ORIGIN: '*',
    LOG_LEVEL: 'info'
  },
  
  // Docker configuration
  docker: {
    NODE_ENV: 'production',
    PORT: process.env.PORT || '10000',
    HOST: '0.0.0.0',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    LOG_LEVEL: 'info'
  }
};

/**
 * Get configuration for a specific environment
 */
export function getConfig(environment = 'development') {
  const config = deploymentConfig[environment] || deploymentConfig.development;
  
  // Merge with process.env for runtime overrides
  return {
    ...config,
    ...process.env
  };
}

/**
 * Set environment variables for a specific deployment
 */
export function setEnvironment(environment = 'development') {
  const config = getConfig(environment);
  
  Object.entries(config).forEach(([key, value]) => {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
  
  return config;
}

export default deploymentConfig;
