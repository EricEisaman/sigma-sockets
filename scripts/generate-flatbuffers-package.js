#!/usr/bin/env node

/**
 * Package-Specific FlatBuffers Generation Script
 * 
 * This script generates FlatBuffers TypeScript files for a specific package
 * and is designed to be called from within package build processes.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the package directory from command line argument or current working directory
const packageDir = process.argv[2] || process.cwd();
const packageName = packageDir.split('/').pop();

console.log(`🔄 Generating FlatBuffers for package: ${packageName}`);

const SCHEMA_FILE = join(__dirname, '..', 'packages', 'client', 'schemas', 'message.fbs');
const TARGET_DIR = join(packageDir, 'src', 'generated', 'sigma-sockets');

function generateFlatBuffers() {
  try {
    // Check if schema file exists
    if (!existsSync(SCHEMA_FILE)) {
      throw new Error(`Schema file not found: ${SCHEMA_FILE}`);
    }
    
    // Ensure target directory exists
    if (!existsSync(TARGET_DIR)) {
      mkdirSync(TARGET_DIR, { recursive: true });
      console.log(`📁 Created directory: ${TARGET_DIR}`);
    }
    
    // Generate TypeScript files from FlatBuffers schema
    console.log('📝 Running flatc compiler...');
    
    // Generate files in the project root
    execSync(`flatc --ts "${SCHEMA_FILE}"`, { 
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    });
    
    // Check if sigma-sockets directory was created
    const generatedDir = join(__dirname, '..', 'sigma-sockets');
    if (!existsSync(generatedDir)) {
      throw new Error('FlatBuffers generation failed - sigma-sockets directory not found');
    }
    
    // Copy generated files to target directory
    console.log('📋 Copying generated files to package...');
    execSync(`cp -r "${generatedDir}"/* "${TARGET_DIR}/"`, { stdio: 'inherit' });
    console.log(`✅ Copied to: ${TARGET_DIR}`);
    
    // Fix TypeScript issues in generated files
    console.log('🔧 Fixing TypeScript issues in generated files...');
    
    // Fix message.ts file
    const messageFile = join(TARGET_DIR, 'message.ts');
    if (existsSync(messageFile)) {
      let content = readFileSync(messageFile, 'utf8');
      // Remove unused imports
      content = content.replace(/unionToMessageData, unionListToMessageData, /g, '');
      // Fix generic type parameter
      content = content.replace(/data<T extends flatbuffers.Table>/g, 'data');
      writeFileSync(messageFile, content);
      console.log(`✅ Fixed TypeScript issues in: ${messageFile}`);
    }
    
    // Fix message-data.ts file to remove unused exports
    const messageDataFile = join(TARGET_DIR, 'message-data.ts');
    if (existsSync(messageDataFile)) {
      let content = readFileSync(messageDataFile, 'utf8');
      // Remove all imports since they're not used
      content = content.replace(/import { [^}]+ } from '\.\/[^']+';/g, '');
      // Remove the unused union functions
      content = content.replace(/export function unionToMessageData\([\s\S]*?\n}/gm, '');
      content = content.replace(/export function unionListToMessageData\([\s\S]*?\n}/gm, '');
      // Clean up extra blank lines
      content = content.replace(/\n\n\n+/g, '\n\n');
      writeFileSync(messageDataFile, content);
      console.log(`✅ Fixed TypeScript issues in: ${messageDataFile}`);
    }
    
    // Fix import paths in all generated files
    const files = ['message.ts', 'message-data.ts', 'connect-message.ts', 'data-message.ts', 'disconnect-message.ts', 'error-message.ts', 'heartbeat-message.ts', 'reconnect-message.ts'];
    files.forEach(file => {
      const filePath = join(TARGET_DIR, file);
      if (existsSync(filePath)) {
        // Fix relative imports from ../sigma-sockets/ to ./
        execSync(`sed -i '' 's|../sigma-sockets/|./|g' "${filePath}"`, { stdio: 'ignore' });
      }
    });
    
    // Clean up temporary directory
    execSync('rm -rf sigma-sockets', { stdio: 'ignore' });
    
    console.log('✅ FlatBuffers generation completed successfully!');
    
  } catch (error) {
    console.error('❌ FlatBuffers generation failed:', error.message);
    process.exit(1);
  }
}

// Main execution
generateFlatBuffers();
