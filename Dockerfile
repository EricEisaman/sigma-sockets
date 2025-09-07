# Multi-stage build for SigmaSockets Chat Demo
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package*.json ./
COPY packages/*/package*.json ./packages/*/
COPY demos/chat/package*.json ./demos/chat/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build all packages first
RUN npm run build:packages

# Build chat demo (both client and server)
RUN cd demos/chat && npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy built chat demo server
COPY --from=builder /app/demos/chat/dist/chat-server.js ./dist/
COPY --from=builder /app/demos/chat/dist/chat-server.js.map ./dist/

# Copy built Vue client files
COPY --from=builder /app/demos/chat/dist/assets ./dist/assets/
COPY --from=builder /app/demos/chat/dist/index.html ./dist/

# Copy package.json for production dependencies
COPY --from=builder /app/demos/chat/package*.json ./

# Copy built packages (for local dependencies)
COPY --from=builder /app/packages/client/dist ./packages/client/dist
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist

# Copy TypeScript declaration files for packages (needed for ES module resolution)
COPY --from=builder /app/packages/client/dist/types ./packages/client/dist/types
COPY --from=builder /app/packages/server/dist/types ./packages/server/dist/types

# Copy package.json files for local dependencies
COPY --from=builder /app/packages/client/package.json ./packages/client/
COPY --from=builder /app/packages/server/package.json ./packages/server/
COPY --from=builder /app/packages/types/package.json ./packages/types/

# Install only production dependencies for chat demo
RUN npm ci --only=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sigmasockets -u 1001

# Change ownership of the app directory
RUN chown -R sigmasockets:nodejs /app
USER sigmasockets

# Expose port (Render.com will set the actual port via environment variable)
EXPOSE 10000

# Set environment variables (Render.com will override PORT)
ENV NODE_ENV=production
ENV PORT=10000
ENV SIGMASOCKETS_PORT=10000
ENV SIGMASOCKETS_WS_PORT=10000
ENV SIGMASOCKETS_HOST=0.0.0.0

# Health check (use environment variable for port)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get(\`http://localhost:\${process.env.PORT || 10000}/health\`, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the chat demo server
CMD ["node", "dist/chat-server.js"]
