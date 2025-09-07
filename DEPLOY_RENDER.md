# Deploying SigmaSockets Chat Demo on Render.com

This guide will walk you through deploying the SigmaSockets Chat Demo on Render.com using Docker, following the same pattern as the ScholarTrack project.

## Prerequisites

- A Render.com account
- Your SigmaSockets code in a Git repository (GitHub, GitLab, etc.)
- Docker knowledge (basic understanding)

## Step 1: Prepare Your Repository

Ensure your repository contains:
- `Dockerfile` (already included in the project)
- `render.yaml` (already included in the project)
- All source code files
- Built packages in `packages/*/dist/`
- Built chat demo in `demos/chat/dist/`

## Step 2: Create a New Web Service on Render

1. **Log into Render.com** and click "New +"
2. **Select "Web Service"**
3. **Connect your repository** (GitHub, GitLab, etc.)
4. **Choose your SigmaSockets repository**

## Step 3: Configure the Web Service

### Basic Settings
- **Name**: `sigmasockets-chat` (or your preferred name)
- **Environment**: `Docker`
- **Region**: Choose closest to your users (Oregon recommended)
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (root of repository)

### Build & Deploy Settings
- **Build Command**: Leave empty (Docker handles this)
- **Start Command**: Leave empty (Docker handles this)

## Step 4: Environment Variables

Click on "Environment" tab and add the following variables:

### Required Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Port for the HTTP server (Render will override this) |
| `SIGMASOCKETS_PORT` | `3000` | Port for the HTTP server |
| `SIGMASOCKETS_WS_PORT` | `3001` | Port for the WebSocket server |
| `SIGMASOCKETS_HOST` | `0.0.0.0` | Host to bind to |
| `SIGMASOCKETS_MAX_CONNECTIONS` | `1000` | Maximum concurrent connections |
| `SIGMASOCKETS_HEARTBEAT_INTERVAL` | `30000` | Heartbeat interval in milliseconds |
| `SIGMASOCKETS_SESSION_TIMEOUT` | `300000` | Session timeout in milliseconds |
| `SIGMASOCKETS_CORS_ORIGIN` | `*` | CORS origin (use your domain in production) |
| `SIGMASOCKETS_RATE_LIMIT` | `1000` | Rate limit per minute |

### Optional Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `SIGMASOCKETS_BUFFER_SIZE` | `4096` | Message buffer size |
| `SIGMASOCKETS_LOG_LEVEL` | `info` | Logging level |

### Security Considerations

- **Change CORS origin** in production to your specific domain
- **Adjust rate limits** based on your expected traffic
- **Monitor connection limits** to prevent resource exhaustion
- **Use HTTPS/WSS** in production (Render provides this automatically)

## Step 5: Advanced Settings

### Health Check Path
- **Health Check Path**: `/health` (included in the chat server)

### Auto-Deploy
- **Auto-Deploy**: Enable for automatic deployments on push
- **Branch**: `main` (or your preferred branch)

## Step 6: Deploy

1. **Click "Create Web Service"**
2. **Wait for the build** (usually 5-10 minutes)
3. **Monitor the logs** for any errors

## Step 7: Verify Deployment

Once deployed, your application will be available at:
```
https://your-app-name.onrender.com
```

### Test the following:
1. **Frontend loads** correctly at the root URL
2. **Health check** works at `/health`
3. **WebSocket connection** establishes successfully
4. **Chat functionality** works with multiple users
5. **User count** updates correctly
6. **Message broadcasting** works across all connected clients

## Architecture Overview

The deployed application includes:

### HTTP Server (Port 3000)
- Serves the chat demo frontend
- Provides health check endpoint
- Handles static asset serving
- Includes CORS headers

### WebSocket Server (Port 3001)
- Handles real-time chat communication
- Manages client connections
- Implements message broadcasting
- Includes security features (rate limiting, validation)

### Security Features
- Input validation and sanitization
- Rate limiting per client
- CORS configuration
- Security headers
- DoS attack detection

## Troubleshooting

### Common Issues

#### Build Fails
- **Check Dockerfile**: Ensure it's in the root directory
- **Check render.yaml**: Verify configuration
- **Check logs**: Look for specific error messages
- **Verify package builds**: Ensure all packages build successfully

#### Environment Variables Not Working
- **Verify variable names**: Case-sensitive
- **Check port configuration**: Ensure ports are correctly set
- **Restart service**: After changing environment variables

#### WebSocket Connection Issues
- **Check CORS settings**: Ensure origin is allowed
- **Verify port configuration**: WebSocket and HTTP ports must be different
- **Check firewall**: Ensure WebSocket port is accessible
- **Test locally**: Verify WebSocket works in development

#### Frontend Can't Connect to WebSocket
- **Check WebSocket URL**: Must use `wss://` in production
- **Verify CORS**: Backend should allow frontend domain
- **Check network**: Ensure no firewall issues
- **Test WebSocket endpoint**: Verify it's accessible

### Logs and Debugging

1. **View build logs** in Render dashboard
2. **Check runtime logs** for errors
3. **Test health endpoint** directly: `https://your-app.onrender.com/health`
4. **Verify environment variables** are set correctly
5. **Monitor WebSocket connections** in the logs

## Custom Domain (Optional)

1. **Go to Settings** → **Custom Domains**
2. **Add your domain**
3. **Update DNS records** as instructed
4. **Update CORS origin** to use your custom domain

## Scaling Considerations

### Free Tier Limitations
- **Sleep after inactivity**: Service will sleep after 15 minutes
- **Cold start**: First request after sleep may be slow
- **Bandwidth limits**: Check Render's current limits
- **WebSocket connections**: May be limited on free tier

### Paid Tier Benefits
- **Always on**: No sleep mode
- **Better performance**: More resources
- **Custom domains**: SSL certificates included
- **Higher limits**: More bandwidth and build minutes
- **Better WebSocket support**: More reliable connections

## Security Best Practices

1. **Use HTTPS/WSS**: Render provides this automatically
2. **Configure CORS properly**: Restrict to your domain in production
3. **Monitor rate limits**: Adjust based on usage patterns
4. **Regular updates**: Keep dependencies updated
5. **Monitor logs**: Check for suspicious activity
6. **Use environment variables**: Never hardcode sensitive data

## Performance Optimization

### For High Traffic
- **Increase connection limits**: Adjust `SIGMASOCKETS_MAX_CONNECTIONS`
- **Optimize heartbeat interval**: Balance between responsiveness and overhead
- **Monitor memory usage**: Check health endpoint for memory stats
- **Consider load balancing**: For multiple instances

### For Low Latency
- **Reduce heartbeat interval**: For more responsive connections
- **Optimize message size**: Keep messages small
- **Use compression**: Enable if needed (currently disabled for performance)

## Support

If you encounter issues:
1. **Check Render documentation**: https://render.com/docs
2. **Review application logs** in Render dashboard
3. **Verify environment variables** are set correctly
4. **Test locally** with Docker to isolate issues
5. **Check WebSocket connectivity** using browser dev tools

## Example render.yaml

Your project already includes a `render.yaml` file, but here's what it contains:

```yaml
services:
  - type: web
    name: sigmasockets-chat
    env: docker
    plan: starter
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: SIGMASOCKETS_PORT
        value: 3000
      - key: SIGMASOCKETS_WS_PORT
        value: 3001
      - key: SIGMASOCKETS_HOST
        value: 0.0.0.0
      - key: SIGMASOCKETS_MAX_CONNECTIONS
        value: 1000
      - key: SIGMASOCKETS_HEARTBEAT_INTERVAL
        value: 30000
      - key: SIGMASOCKETS_SESSION_TIMEOUT
        value: 300000
      - key: SIGMASOCKETS_CORS_ORIGIN
        value: "*"
      - key: SIGMASOCKETS_RATE_LIMIT
        value: 1000
    healthCheckPath: /health
    autoDeploy: true
    region: oregon
```

## Local Testing

To test the Docker setup locally:

```bash
# Build the Docker image
docker build -t sigmasockets-chat .

# Run the container
docker run -p 3000:3000 -p 3001:3001 sigmasockets-chat

# Test the application
curl http://localhost:3000/health
```

Remember to replace `your-app-name` with your actual Render service name.
