# Multi-stage build for SigmaSockets Chat Demo
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package.json and workspace configuration
COPY package*.json ./
COPY tsconfig.json ./

# Copy packages with their package.json files
COPY packages/types/package*.json ./packages/types/
COPY packages/client/package*.json ./packages/client/
COPY packages/server/package*.json ./packages/server/

# Copy chat demo package.json
COPY demos/chat/package*.json ./demos/chat/

# Install dependencies
RUN npm install

# Copy source code for packages
COPY packages/types/ ./packages/types/
COPY packages/client/ ./packages/client/
COPY packages/server/ ./packages/server/

# Copy scripts needed for building
COPY scripts/ ./scripts/

# Copy chat demo source
COPY demos/chat/ ./demos/chat/

# Build packages individually to avoid workspace conflicts
RUN cd packages/types && npm run build
RUN cd packages/client && npm run build
RUN cd packages/server && npm run build

# Build chat demo (both client and server)
# First build the server with explicit config
RUN cd demos/chat && npx tsc -p tsconfig.build.json
# Then build the client
RUN cd demos/chat && npm run build:client
# Verify server file was created
RUN ls -la /app/demos/chat/dist/chat-server.js

# Verify build outputs exist
RUN ls -la /app/demos/chat/dist/
RUN ls -la /app/demos/chat/public/

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy built chat demo server
COPY --from=builder /app/demos/chat/dist/chat-server.js ./dist/

# Copy built Vue client files (includes public assets from Vite build)
COPY --from=builder /app/demos/chat/dist/assets ./dist/assets/
COPY --from=builder /app/demos/chat/dist/index.html ./dist/
COPY --from=builder /app/demos/chat/dist/browserconfig.xml ./dist/
COPY --from=builder /app/demos/chat/dist/site.webmanifest ./dist/
COPY --from=builder /app/demos/chat/dist/images ./dist/images/

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
