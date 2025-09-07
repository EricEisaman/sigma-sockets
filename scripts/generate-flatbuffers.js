#!/usr/bin/env node

/**
 * FlatBuffers Generation Script with TypeScript Server Restart
 * 
 * This script generates FlatBuffers TypeScript files and automatically
 * restarts the TypeScript language server to resolve module resolution issues.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const SCHEMA_FILE = 'packages/client/schemas/message.fbs';
const GENERATED_DIRS = [
  'packages/client/src/generated/sigma-sockets',
  'packages/server/src/generated/sigma-sockets',
  'apps/benchmark/src/generated/sigma-sockets',
  'demos/chat/src/generated/sigma-sockets'
];

function generateFlatBuffers() {
  console.log('🔄 Generating FlatBuffers TypeScript files...');
  
  try {
    // Check if schema file exists
    if (!existsSync(SCHEMA_FILE)) {
      throw new Error(`Schema file not found: ${SCHEMA_FILE}`);
    }
    
    // Generate TypeScript files from FlatBuffers schema
    console.log('📝 Running flatc compiler...');
    execSync(`flatc --ts ${SCHEMA_FILE}`, { stdio: 'inherit' });
    
    // Ensure generated directories exist
    GENERATED_DIRS.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
    
    // Copy generated files to all packages
    console.log('📋 Copying generated files to packages...');
    GENERATED_DIRS.forEach(dir => {
      execSync(`cp -r sigma-sockets/* ${dir}/`, { stdio: 'inherit' });
      console.log(`✅ Copied to: ${dir}`);
    });
    
    // Fix TypeScript issues in generated files
    console.log('🔧 Fixing TypeScript issues in generated files...');
    GENERATED_DIRS.forEach(dir => {
      const messageFile = join(dir, 'message.ts');
      if (existsSync(messageFile)) {
        // Remove unused imports and fix generic type parameter
        execSync(`sed -i '' 's/unionToMessageData, unionListToMessageData, //g' "${messageFile}"`, { stdio: 'ignore' });
        execSync(`sed -i '' 's/data<T extends flatbuffers.Table>/data/g' "${messageFile}"`, { stdio: 'ignore' });
        console.log(`✅ Fixed TypeScript issues in: ${messageFile}`);
      }
      
      // Fix import paths in all generated files
      const files = ['message.ts', 'message-data.ts', 'connect-message.ts', 'data-message.ts', 'disconnect-message.ts', 'error-message.ts', 'heartbeat-message.ts', 'reconnect-message.ts'];
      files.forEach(file => {
        const filePath = join(dir, file);
        if (existsSync(filePath)) {
          // Fix relative imports from ../sigma-sockets/ to ./
          execSync(`sed -i '' 's|../sigma-sockets/|./|g' "${filePath}"`, { stdio: 'ignore' });
        }
      });
    });
    
    // Clean up temporary directory
    execSync('rm -rf sigma-sockets', { stdio: 'ignore' });
    
    console.log('✅ FlatBuffers generation completed successfully!');
    
    // Restart TypeScript server
    console.log('🔄 Restarting TypeScript language server...');
    execSync('node scripts/restart-ts-server.js flatbuffers', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('❌ FlatBuffers generation failed:', error.message);
    process.exit(1);
  }
}

// Main execution
generateFlatBuffers();
