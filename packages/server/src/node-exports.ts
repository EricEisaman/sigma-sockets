/**
 * Node.js-only exports for SigmaSockets Server
 * 
 * These exports are only available in Node.js environments and provide
 * advanced functionality like custom FlatBuffers generation.
 */

export { generateFlatBuffers, getDefaultSchema, type FlatBuffersConfig, type FlatBuffersResult } from './flatbuffers-generator';
