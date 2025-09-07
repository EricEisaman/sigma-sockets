# Multi-stage Docker build for SigmaSockets Chat Demo using npm packages
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY demos/chat/package*.json ./
COPY demos/chat/tsconfig*.json ./
COPY demos/chat/vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy source code
COPY demos/chat/src ./src/
COPY demos/chat/public ./public/
COPY demos/chat/index.html ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sigmasockets -u 1001

# Change ownership of the app directory
RUN chown -R sigmasockets:nodejs /app

# Switch to non-root user
USER sigmasockets

# Expose port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:10000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/chat-server.js"]
