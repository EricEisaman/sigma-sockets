# @sigmasockets/types

Shared TypeScript type definitions for the SigmaSockets WebSocket system.

## Installation

```bash
npm install @sigmasockets/types
```

## Usage

### Import All Types

```typescript
import type {
  ConnectionStatus,
  Message,
  SigmaSocketClient,
  SigmaSocketServer,
  SigmaSocketError,
} from '@sigmasockets/types';
```

### Import Specific Type Categories

```typescript
// Common types
import type { ConnectionStatus, Message } from '@sigmasockets/types/common';

// Client types
import type { SigmaSocketClient, ClientEvents } from '@sigmasockets/types/client';

// Server types
import type { SigmaSocketServer, ServerEvents } from '@sigmasockets/types/server';
```

## Type Categories

### Common Types (`/common`)

Core types shared between client and server:

- `ConnectionStatus` - Connection state enumeration
- `Message` - WebSocket message types
- `ClientSession` - Client session information
- `ConnectionConfig` - Connection configuration
- `ServerConfig` - Server configuration
- `SigmaSocketError` - Custom error class
- `ErrorCode` - Error code enumeration

### Client Types (`/client`)

Client-specific types:

- `SigmaSocketClient` - Main client interface
- `SigmaSocketClientConfig` - Client configuration
- `ClientEvents` - Client event types
- `ClientPlugin` - Plugin interface
- `ClientMiddleware` - Middleware interface
- `ClientBuilder` - Builder pattern interface

### Server Types (`/server`)

Server-specific types:

- `SigmaSocketServer` - Main server interface
- `SigmaSocketServerConfig` - Server configuration
- `ServerEvents` - Server event types
- `ServerPlugin` - Plugin interface
- `ServerMiddleware` - Middleware interface
- `ServerBuilder` - Builder pattern interface

## Examples

### Client Usage

```typescript
import type { SigmaSocketClient, ConnectionStatus } from '@sigmasockets/types';

const client: SigmaSocketClient = new SigmaSocketClient({
  url: 'ws://localhost:8080',
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
});

client.on('connection', (status: ConnectionStatus) => {
  console.log('Connection status:', status);
});
```

### Server Usage

```typescript
import type { SigmaSocketServer, Message } from '@sigmasockets/types';

const server: SigmaSocketServer = new SigmaSocketServer({
  port: 8080,
  heartbeatInterval: 30000,
});

server.on('message', (clientId: string, message: Message) => {
  console.log('Received message from', clientId, ':', message);
});
```

### Error Handling

```typescript
import type { SigmaSocketError, ErrorCode } from '@sigmasockets/types';

try {
  // Some SigmaSockets operation
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

## Type Safety Features

### Strict Type Checking

All types are designed with strict TypeScript in mind:

- No `any` types in public APIs
- Comprehensive error handling types
- Immutable interfaces where appropriate
- Proper generic constraints

### IntelliSense Support

Full IntelliSense support for:

- Method signatures
- Property types
- Event callbacks
- Configuration options
- Error codes and messages

### Compile-Time Validation

Type definitions provide compile-time validation for:

- Configuration objects
- Event handlers
- Message structures
- Error handling
- Plugin interfaces

## Version Compatibility

This package follows semantic versioning:

- **Major version**: Breaking changes to type definitions
- **Minor version**: New types or non-breaking additions
- **Patch version**: Bug fixes and documentation updates

## Contributing

When adding new types:

1. Follow the existing naming conventions
2. Add comprehensive JSDoc comments
3. Include examples in documentation
4. Update this README if needed
5. Ensure backward compatibility

## License

MIT
