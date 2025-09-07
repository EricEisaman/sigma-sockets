# SigmaSockets Monorepo

High-performance WebSocket system with FlatBuffers serialization and automatic reconnection for TypeScript/JavaScript applications.

## 🏗️ Monorepo Structure

```
sigmasockets/
├── packages/
│   ├── client/          # SigmaSockets Client Package
│   └── server/          # SigmaSockets Server Package
├── demos/
│   └── chat/            # Chat Demo Application
├── apps/
│   └── benchmark/       # Performance Benchmark Suite
└── docs/                # Documentation
```

## 🚀 Quick Start

### Installation

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Run all tests
npm run test
```

### Development

```bash
# Start development mode for all packages
npm run dev

# Start specific package in development mode
npm run dev:client
npm run dev:server
npm run dev:chat
npm run dev:benchmark
```

## 📦 Packages

### SigmaSockets Client (`packages/client`)

High-performance WebSocket client with FlatBuffers serialization and automatic reconnection.

```typescript
import { SigmaSocketClient } from 'sigmasockets-client'

const client = new SigmaSocketClient({
  url: 'ws://localhost:8080',
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000
})

await client.connect()
client.send(new TextEncoder().encode('Hello, SigmaSockets!'))
```

### SigmaSockets Server (`packages/server`)

High-performance WebSocket server with session management and broadcasting capabilities.

```typescript
import { SigmaSocketServer } from 'sigmasockets-server'

const server = new SigmaSocketServer({
  port: 8080,
  heartbeatInterval: 30000,
  sessionTimeout: 300000
})

await server.start()
server.broadcast(new TextEncoder().encode('Broadcast message'))
```

## 🎮 Demos

### Chat Demo (`demos/chat`)

A real-time chat application showcasing SigmaSockets client and server integration.

```bash
# Start the chat demo
npm run dev:chat
```

## 📊 Benchmarking

### Performance Suite (`apps/benchmark`)

Comprehensive performance testing suite to validate SigmaSockets performance against µWebSockets.js.

```bash
# Run benchmarks
npm run benchmark

# Run specific benchmark
npm run benchmark:client
npm run benchmark:server
```

## 🛠️ Scripts

### Build Scripts
- `npm run build` - Build all packages
- `npm run build:client` - Build client package
- `npm run build:server` - Build server package
- `npm run build:chat` - Build chat demo
- `npm run build:benchmark` - Build benchmark suite

### Development Scripts
- `npm run dev` - Start all packages in development mode
- `npm run dev:client` - Start client development
- `npm run dev:server` - Start server development
- `npm run dev:chat` - Start chat demo
- `npm run dev:benchmark` - Start benchmark development

### Test Scripts
- `npm run test` - Run all tests
- `npm run test:client` - Test client package
- `npm run test:server` - Test server package
- `npm run test:chat` - Test chat demo
- `npm run test:benchmark` - Test benchmark suite

### Publishing Scripts
- `npm run publish:client` - Publish client package to npm
- `npm run publish:server` - Publish server package to npm
- `npm run publish:all` - Publish all packages to npm

### Utility Scripts
- `npm run clean` - Clean all build artifacts
- `npm run lint` - Lint all packages
- `npm run type-check` - Type check all packages

## 🧪 Testing

All packages use Vitest for testing with TypeScript support:

```bash
# Run tests with UI
npm run test:ui

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- packages/client/src/index.test.ts
```

## 📋 Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0
- TypeScript >= 5.0.0

## 🏆 Performance Goals

SigmaSockets is designed to outperform existing WebSocket solutions:

- **Zero-copy deserialization** with FlatBuffers
- **Minimal memory overhead** through efficient data structures
- **Robust reconnection** with exponential backoff
- **Type-safe APIs** with full TypeScript support
- **High throughput** optimized for multiplayer applications

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📚 Documentation

- [Architecture Design](./architecture_design.md)
- [Research Summary](./research_summary.md)
- [Performance Benchmarks](./SigmaSockets%20Performance%20Benchmark%20Results.md)
- [Deployment Guide](./SigmaSockets%20Deployment%20Guide.md)