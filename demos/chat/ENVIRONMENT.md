# Environment Configuration

This document describes how to configure the SigmaSockets Chat Demo for different environments.

## Environment Variables

### Development Environment

```bash
NODE_ENV=development
WS_PORT=3002
VITE_WS_PORT=3002
VITE_DEBUG=true
HOST=localhost
CORS_ORIGIN=*
LOG_LEVEL=debug
```

### Production Environment

```bash
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
CORS_ORIGIN=*
LOG_LEVEL=info
SIGMASOCKETS_HEARTBEAT_INTERVAL=30000
SIGMASOCKETS_SESSION_TIMEOUT=300000
SIGMASOCKETS_MAX_CONNECTIONS=1000
```

## Running the Application

### Development Mode

```bash
# Start development server with hot reload
npm run dev

# Or explicitly set development environment
NODE_ENV=development npm run dev
```

### Production Mode

```bash
# Start production server
npm start

# Or build and start production server
npm run start:prod
```

### Custom Port Configuration

```bash
# Use custom WebSocket port for development
WS_PORT=3003 npm run dev

# Use custom port for production
PORT=8080 npm start
```

## Deployment Platforms

### Render.com

The application is configured to work with Render.com out of the box:

- Uses `PORT` environment variable (automatically set by Render)
- Binds to `0.0.0.0` for external access
- CORS configured for web access

### Docker

```dockerfile
# Set environment variables in Dockerfile
ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0
```

### Local Development

```bash
# Set development environment
export NODE_ENV=development
export WS_PORT=3002
export VITE_DEBUG=true

# Start development server
npm run dev
```

## Configuration Files

- `env.config.js` - Environment configuration logic
- `deploy.config.js` - Deployment-specific configurations
- `package.json` - Scripts with environment variables

## WebSocket URL Configuration

The application automatically configures WebSocket URLs based on environment:

- **Development**: `ws://localhost:3002`
- **Production**: `wss://your-domain.com:10000`

## Debug Mode

Debug mode is automatically enabled in development and can be controlled with:

```bash
VITE_DEBUG=true npm run dev
```

## Security Configuration

CORS origins can be configured per environment:

```bash
# Development (allow all)
CORS_ORIGIN=*

# Production (specific domain)
CORS_ORIGIN=https://your-domain.com
```
