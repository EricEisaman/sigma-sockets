/**
 * SigmaSockets TypeScript Type Definitions
 * 
 * This package provides comprehensive TypeScript type definitions for the SigmaSockets
 * WebSocket system, including client, server, and shared types.
 */

// Re-export all common types
export * from './common.js';

// Re-export client-specific types
export * from './client.js';

// Re-export server-specific types
export * from './server.js';

// Version information
export const SIGMASOCKETS_TYPES_VERSION = '1.0.0' as const;
