# SigmaSockets TypeScript Types

This document explains the TypeScript type system for SigmaSockets, including how to use the types package and how declaration files are generated and distributed.

## 📦 Types Package Structure

### `@sigmasockets/types`

The main types package that provides comprehensive TypeScript definitions for the entire SigmaSockets ecosystem.

```
packages/types/
├── src/
│   ├── common.ts      # Shared types between client and server
│   ├── client.ts      # Client-specific types
│   ├── server.ts      # Server-specific types
│   └── index.ts       # Main export file
├── dist/              # Generated declaration files
├── package.json       # Package configuration
├── tsconfig.json      # TypeScript configuration
└── README.md          # Package documentation
```

## 🚀 Installation and Usage

### Install the Types Package

```bash
npm install @sigmasockets/types
```

### Import Types

```typescript
// Import all types
import type {
  ConnectionStatus,
  Message,
  SigmaSocketClient,
  SigmaSocketServer,
  SigmaSocketError,
} from '@sigmasockets/types';

// Import specific type categories
import type { ConnectionStatus, Message } from '@sigmasockets/types/common';
import type { SigmaSocketClient, ClientEvents } from '@sigmasockets/types/client';
import type { SigmaSocketServer, ServerEvents } from '@sigmasockets/types/server';
```

## 📋 Type Categories

### Common Types (`/common`)

Core types shared between client and server:

#### Connection Management
- `ConnectionStatus` - Enumeration of connection states
- `ConnectionConfig` - Client connection configuration
- `ServerConfig` - Server configuration
- `ClientSession` - Client session information

#### Message System
- `Message` - Union type for all message types
- `DataMessage` - Data payload messages
- `HeartbeatMessage` - Heartbeat/keepalive messages
- `ConnectionMessage` - Connection establishment messages
- `DisconnectionMessage` - Disconnection messages
- `ErrorMessage` - Error messages

#### Error Handling
- `SigmaSocketError` - Custom error class
- `ErrorCode` - Enumeration of error codes

#### Performance
- `PerformanceMetrics` - Performance monitoring data
- `FlatBufferMessage` - FlatBuffer-specific message format

### Client Types (`/client`)

Client-specific interfaces and types:

#### Core Client
- `SigmaSocketClient` - Main client interface
- `SigmaSocketClientConfig` - Client configuration
- `ClientEvents` - Event callback types
- `ClientState` - Client state information

#### Client Extensions
- `ClientPlugin` - Plugin interface
- `ClientMiddleware` - Middleware interface
- `ClientBuilder` - Builder pattern interface

#### Client Utilities
- `ClientStatistics` - Client performance statistics
- `ConnectionOptions` - Connection-specific options
- `MessageOptions` - Message-specific options

### Server Types (`/server`)

Server-specific interfaces and types:

#### Core Server
- `SigmaSocketServer` - Main server interface
- `SigmaSocketServerConfig` - Server configuration
- `ServerEvents` - Event callback types
- `ServerState` - Server state information

#### Server Extensions
- `ServerPlugin` - Plugin interface
- `ServerMiddleware` - Middleware interface
- `ServerBuilder` - Builder pattern interface

#### Server Management
- `ServerStatistics` - Server performance statistics
- `ServerHealthCheck` - Health monitoring
- `ServerMonitoring` - Comprehensive monitoring
- `ClusterConfig` - Clustering configuration

## 🔧 Declaration Files (.d.ts)

### Automatic Generation

Declaration files are automatically generated during the build process:

```bash
# Build types package
npm run build:types

# Build all packages (includes types)
npm run build:packages
```

### Generated Files

The build process generates:

```
packages/types/dist/
├── index.d.ts         # Main declaration file
├── index.js           # Main JavaScript file (empty for types-only)
├── common.d.ts        # Common types declarations
├── common.js          # Common types JavaScript
├── client.d.ts        # Client types declarations
├── client.js          # Client types JavaScript
├── server.d.ts        # Server types declarations
└── server.js          # Server types JavaScript
```

### Package.json Exports

The types package uses modern package.json exports:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./client": {
      "import": "./dist/client.js",
      "types": "./dist/client.d.ts"
    },
    "./server": {
      "import": "./dist/server.js",
      "types": "./dist/server.d.ts"
    },
    "./common": {
      "import": "./dist/common.js",
      "types": "./dist/common.d.ts"
    }
  }
}
```

## 📦 Package Distribution

### Client Package (`sigmasockets-client`)

The client package includes:

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist/**/*",
    "schemas/**/*"
  ]
}
```

### Server Package (`sigmasockets-server`)

The server package includes:

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist/**/*",
    "schemas/**/*"
  ]
}
```

## 🎯 Type Safety Features

### Strict Type Checking

All types are designed with maximum type safety:

- **No `any` types** in public APIs
- **Comprehensive error handling** with typed error codes
- **Immutable interfaces** where appropriate
- **Proper generic constraints** for extensibility

### IntelliSense Support

Full IDE support including:

- **Method signatures** with parameter types
- **Property types** with documentation
- **Event callbacks** with proper typing
- **Configuration options** with validation
- **Error codes** with descriptions

### Compile-Time Validation

Type definitions provide:

- **Configuration validation** at compile time
- **Event handler type checking**
- **Message structure validation**
- **Error handling verification**
- **Plugin interface compliance**

## 🔄 Development Workflow

### Building Types

```bash
# Build only types package
npm run build:types

# Build types and dependent packages
npm run build:packages

# Watch mode for development
npm run dev:types
```

### Testing Types

```bash
# Type check all packages
npm run type-check

# Test types package
npm run test:types
```

### Publishing Types

```bash
# Publish types package
npm run publish:types

# Publish all packages (includes types)
npm run publish:all
```

## 📚 Usage Examples

### Basic Client Usage

```typescript
import type { SigmaSocketClient, ConnectionStatus } from '@sigmasockets/types';

const client: SigmaSocketClient = new SigmaSocketClient({
  url: 'ws://localhost:8080',
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
});

client.on('connection', (status: ConnectionStatus) => {
  if (status === ConnectionStatus.Connected) {
    console.log('Connected to server');
  }
});
```

### Basic Server Usage

```typescript
import type { SigmaSocketServer, Message } from '@sigmasockets/types';

const server: SigmaSocketServer = new SigmaSocketServer({
  port: 8080,
  heartbeatInterval: 30000,
});

server.on('message', (clientId: string, message: Message) => {
  console.log(`Message from ${clientId}:`, message);
});
```

### Error Handling

```typescript
import type { SigmaSocketError, ErrorCode } from '@sigmasockets/types';

try {
  await client.connect();
} catch (error) {
  if (error instanceof SigmaSocketError) {
    switch (error.code) {
      case ErrorCode.ConnectionFailed:
        console.error('Connection failed:', error.message);
        break;
      case ErrorCode.AuthenticationFailed:
        console.error('Authentication failed:', error.message);
        break;
      default:
        console.error('SigmaSocket error:', error.message);
    }
  }
}
```

### Plugin Development

```typescript
import type { ClientPlugin, SigmaSocketClient } from '@sigmasockets/types';

class LoggingPlugin implements ClientPlugin {
  readonly name = 'logging';
  readonly version = '1.0.0';

  install(client: SigmaSocketClient): void {
    client.on('message', (message) => {
      console.log('Message received:', message);
    });
  }

  uninstall(client: SigmaSocketClient): void {
    // Cleanup logic
  }
}
```

## 🚀 Advanced Features

### Conditional Types

The types package uses advanced TypeScript features:

```typescript
// Conditional message handling
type MessageHandler<T extends Message> = T extends DataMessage
  ? (message: DataMessage) => void
  : T extends HeartbeatMessage
  ? (message: HeartbeatMessage) => void
  : (message: Message) => void;
```

### Generic Constraints

```typescript
// Plugin interface with constraints
interface Plugin<T extends SigmaSocketClient | SigmaSocketServer> {
  install(target: T): void;
  uninstall(target: T): void;
}
```

### Utility Types

```typescript
// Extract event types
type ClientEventNames = keyof ClientEvents;
type ServerEventNames = keyof ServerEvents;

// Extract configuration types
type ClientConfigKeys = keyof SigmaSocketClientConfig;
type ServerConfigKeys = keyof SigmaSocketServerConfig;
```

## 🔧 Configuration

### TypeScript Configuration

The types package uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### ESLint Configuration

Strict linting rules for type definitions:

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error"
  }
}
```

## 📈 Performance Considerations

### Type-Only Imports

Use type-only imports to reduce bundle size:

```typescript
import type { ConnectionStatus } from '@sigmasockets/types';
```

### Tree Shaking

The types package is designed for optimal tree shaking:

- **Separate exports** for different type categories
- **Minimal runtime code** (types-only package)
- **Efficient bundling** with modern bundlers

## 🆘 Troubleshooting

### Common Issues

#### Type Not Found
```bash
# Ensure types package is installed
npm install @sigmasockets/types

# Check package.json dependencies
npm ls @sigmasockets/types
```

#### Declaration File Missing
```bash
# Rebuild types package
npm run build:types

# Check dist directory
ls packages/types/dist/
```

#### Import Errors
```typescript
// Use type-only imports
import type { ConnectionStatus } from '@sigmasockets/types';

// Check export paths
import type { ConnectionStatus } from '@sigmasockets/types/common';
```

### Getting Help

- Check the types package README: `packages/types/README.md`
- Review TypeScript documentation: https://www.typescriptlang.org/
- Check package exports: `npm info @sigmasockets/types`
- Run type checking: `npm run type-check`
