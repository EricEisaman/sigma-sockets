# SigmaSockets Deployment Guide

This guide covers deploying the SigmaSockets packages to npm and setting up the chat demo.

## Package Structure

```
sigmasockets/
├── sigmasockets-client/          # Client package
│   ├── dist/                     # Compiled TypeScript
│   ├── schemas/                  # FlatBuffers schemas
│   ├── src/                      # Source code
│   └── package.json
├── sigmasockets-server/          # Server package
│   ├── dist/                     # Compiled TypeScript
│   ├── schemas/                  # FlatBuffers schemas
│   ├── src/                      # Source code
│   └── package.json
├── chat-demo/                    # Demo application
│   ├── client/                   # Vue.js + Vuetify client
│   └── server/                   # Node.js server
└── benchmarks/                   # Performance benchmarks
```

## NPM Deployment

### Prerequisites

1. Create npm account at https://www.npmjs.com
2. Login to npm: `npm login`
3. Verify access: `npm whoami`

### Publishing Client Package

```bash
cd sigmasockets-client
npm run build
npm test  # Run tests if available
npm publish
```

### Publishing Server Package

```bash
cd sigmasockets-server
npm run build
npm test  # Run tests if available
npm publish
```

### Package Versions

Both packages are currently at version 1.0.0. For updates:

```bash
# Patch version (1.0.1)
npm version patch

# Minor version (1.1.0)
npm version minor

# Major version (2.0.0)
npm version major
```

## Installation Instructions

### For End Users

```bash
# Install client package
npm install sigmasockets-client

# Install server package
npm install sigmasockets-server
```

### For Development

```bash
# Clone repository
git clone <repository-url>
cd sigmasockets

# Install dependencies for all packages
cd sigmasockets-client && npm install && cd ..
cd sigmasockets-server && npm install && cd ..
cd chat-demo/client && npm install && cd ../..
cd chat-demo/server && npm install && cd ../..
cd benchmarks && npm install && cd ..

# Build all packages
cd sigmasockets-client && npm run build && cd ..
cd sigmasockets-server && npm run build && cd ..
cd chat-demo/server && npm run build && cd ../..
```

## Chat Demo Deployment

### Local Development

```bash
# Start the chat server
cd chat-demo/server
npm start

# Server will be available at:
# HTTP: http://localhost:3000
# WebSocket: ws://localhost:3001
```

### Production Deployment

#### Option 1: Docker

```dockerfile
# Dockerfile for chat demo
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY chat-demo/server/package*.json ./
COPY sigmasockets-server/ ./node_modules/sigmasockets-server/

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY chat-demo/server/dist/ ./dist/
COPY chat-demo/client/ ./dist/client/

# Expose ports
EXPOSE 3000 3001

# Start server
CMD ["node", "dist/chat-server.js"]
```

Build and run:
```bash
docker build -t sigmasockets-chat .
docker run -p 3000:3000 -p 3001:3001 sigmasockets-chat
```

#### Option 2: PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'sigmasockets-chat',
    script: 'dist/chat-server.js',
    cwd: './chat-demo/server',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Option 3: Systemd Service

```bash
# Create service file
sudo tee /etc/systemd/system/sigmasockets-chat.service << EOF
[Unit]
Description=SigmaSockets Chat Demo
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/chat-demo/server
ExecStart=/usr/bin/node dist/chat-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable sigmasockets-chat
sudo systemctl start sigmasockets-chat
sudo systemctl status sigmasockets-chat
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # HTTP traffic (chat interface)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket traffic
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Environment Configuration

### Environment Variables

```bash
# Server configuration
export SIGMASOCKETS_PORT=3000
export SIGMASOCKETS_WS_PORT=3001
export SIGMASOCKETS_HOST=0.0.0.0

# Performance tuning
export SIGMASOCKETS_MAX_CONNECTIONS=10000
export SIGMASOCKETS_HEARTBEAT_INTERVAL=60000
export SIGMASOCKETS_SESSION_TIMEOUT=300000

# Security
export SIGMASOCKETS_CORS_ORIGIN="*"
export SIGMASOCKETS_RATE_LIMIT=1000
```

### Configuration File

```typescript
// config.ts
export const config = {
  server: {
    port: parseInt(process.env.SIGMASOCKETS_PORT || '3000'),
    wsPort: parseInt(process.env.SIGMASOCKETS_WS_PORT || '3001'),
    host: process.env.SIGMASOCKETS_HOST || '0.0.0.0'
  },
  performance: {
    maxConnections: parseInt(process.env.SIGMASOCKETS_MAX_CONNECTIONS || '10000'),
    heartbeatInterval: parseInt(process.env.SIGMASOCKETS_HEARTBEAT_INTERVAL || '60000'),
    sessionTimeout: parseInt(process.env.SIGMASOCKETS_SESSION_TIMEOUT || '300000')
  },
  security: {
    corsOrigin: process.env.SIGMASOCKETS_CORS_ORIGIN || '*',
    rateLimit: parseInt(process.env.SIGMASOCKETS_RATE_LIMIT || '1000')
  }
};
```

## Monitoring and Logging

### Health Check Endpoint

```typescript
// Add to chat server
app.get('/health', (req, res) => {
  const stats = server.getStats();
  res.json({
    status: 'healthy',
    uptime: stats.uptime,
    connections: stats.connectedClients,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});
```

### Logging Configuration

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## Performance Optimization

### Node.js Tuning

```bash
# Increase memory limit
node --max-old-space-size=4096 dist/chat-server.js

# Enable V8 optimizations
node --optimize-for-size dist/chat-server.js

# Garbage collection tuning
node --gc-interval=100 dist/chat-server.js
```

### OS-Level Tuning

```bash
# Increase file descriptor limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# TCP tuning for high-concurrency
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

2. **WebSocket Connection Failed**
   - Check firewall settings
   - Verify WebSocket port is exposed
   - Check proxy configuration

3. **High Memory Usage**
   - Monitor with `htop` or `ps`
   - Check for memory leaks
   - Tune garbage collection

4. **Connection Drops**
   - Verify heartbeat configuration
   - Check network stability
   - Review reconnection logic

### Debug Mode

```bash
# Enable debug logging
DEBUG=sigmasockets:* npm start

# Node.js inspector
node --inspect dist/chat-server.js
```

## Security Considerations

1. **CORS Configuration**: Restrict origins in production
2. **Rate Limiting**: Implement per-client rate limits
3. **Input Validation**: Validate all incoming messages
4. **SSL/TLS**: Use HTTPS/WSS in production
5. **Authentication**: Implement user authentication
6. **Firewall**: Restrict access to necessary ports only

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use sticky sessions
2. **Redis**: Shared session storage
3. **Message Queue**: For cross-server communication
4. **Database**: Persistent message storage

### Vertical Scaling

1. **CPU**: Multi-core utilization
2. **Memory**: Increase heap size
3. **Network**: High-bandwidth connections
4. **Storage**: SSD for logs and sessions

This deployment guide ensures reliable production deployment of SigmaSockets packages and the chat demo application.

