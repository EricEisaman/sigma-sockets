#!/usr/bin/env node

/**
 * TypeScript Language Server Restart Utility
 * 
 * This script automatically restarts the TypeScript language server
 * to resolve module resolution issues after generating new files.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const VSCODE_PID_FILE = join(process.env.HOME || '', '.vscode-server/data/logs');
const CURSOR_PID_FILE = join(process.env.HOME || '', '.cursor-server/data/logs');

function restartTypeScriptServer() {
  console.log('🔄 Restarting TypeScript Language Server...');
  
  try {
    // Method 1: VS Code Command Palette (if VS Code is running)
    if (existsSync(VSCODE_PID_FILE)) {
      console.log('📝 Detected VS Code - attempting restart via command palette');
      try {
        execSync('osascript -e "tell application \\"Visual Studio Code\\" to activate"', { stdio: 'ignore' });
        execSync('osascript -e "tell application \\"System Events\\" to keystroke \\"p\\" using {command down, shift down}"', { stdio: 'ignore' });
        setTimeout(() => {
          execSync('osascript -e "tell application \\"System Events\\" to keystroke \\"TypeScript: Restart TS Server\\""', { stdio: 'ignore' });
          execSync('osascript -e "tell application \\"System Events\\" to key code 36"', { stdio: 'ignore' }); // Enter key
        }, 1000);
        console.log('✅ TypeScript server restart command sent to VS Code');
        return;
      } catch (error) {
        console.log('⚠️  VS Code restart failed, trying alternative methods');
      }
    }
    
    // Method 2: Cursor Command Palette (if Cursor is running)
    if (existsSync(CURSOR_PID_FILE)) {
      console.log('🎯 Detected Cursor - attempting restart via command palette');
      try {
        execSync('osascript -e "tell application \\"Cursor\\" to activate"', { stdio: 'ignore' });
        execSync('osascript -e "tell application \\"System Events\\" to keystroke \\"p\\" using {command down, shift down}"', { stdio: 'ignore' });
        setTimeout(() => {
          execSync('osascript -e "tell application \\"System Events\\" to keystroke \\"TypeScript: Restart TS Server\\""', { stdio: 'ignore' });
          execSync('osascript -e "tell application \\"System Events\\" to key code 36"', { stdio: 'ignore' }); // Enter key
        }, 1000);
        console.log('✅ TypeScript server restart command sent to Cursor');
        return;
      } catch (error) {
        console.log('⚠️  Cursor restart failed, trying alternative methods');
      }
    }
    
    // Method 3: Kill TypeScript processes and let IDE restart them
    console.log('🔧 Attempting to restart by killing TypeScript processes...');
    try {
      execSync('pkill -f "tsserver"', { stdio: 'ignore' });
      execSync('pkill -f "typescript"', { stdio: 'ignore' });
      console.log('✅ TypeScript processes killed - IDE will restart them automatically');
    } catch (error) {
      console.log('⚠️  No TypeScript processes found to kill');
    }
    
    // Method 4: Clear TypeScript cache
    console.log('🧹 Clearing TypeScript cache...');
    try {
      const cacheDir = join(process.cwd(), 'node_modules/.cache');
      if (existsSync(cacheDir)) {
        execSync(`rm -rf ${cacheDir}`, { stdio: 'ignore' });
        console.log('✅ TypeScript cache cleared');
      }
    } catch (error) {
      console.log('⚠️  Could not clear TypeScript cache');
    }
    
    console.log('🎉 TypeScript server restart completed!');
    console.log('💡 If issues persist, manually restart your IDE or run: Cmd+Shift+P → "TypeScript: Restart TS Server"');
    
  } catch (error) {
    console.error('❌ Failed to restart TypeScript server:', error.message);
    console.log('💡 Manual restart required: Cmd+Shift+P → "TypeScript: Restart TS Server"');
  }
}

function shouldRestartTS() {
  const args = process.argv.slice(2);
  
  // Auto-restart triggers
  const triggers = [
    'flatbuffers',
    'generate',
    'build',
    'compile',
    'regenerate',
    'update-types'
  ];
  
  const shouldRestart = args.some(arg => 
    triggers.some(trigger => arg.toLowerCase().includes(trigger))
  );
  
  return shouldRestart || args.includes('--restart-ts') || args.includes('-r');
}

// Main execution
if (shouldRestartTS()) {
  restartTypeScriptServer();
} else {
  console.log('🔄 TypeScript Language Server Restart Utility');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/restart-ts-server.js [--restart-ts|-r]');
  console.log('  node scripts/restart-ts-server.js flatbuffers');
  console.log('  node scripts/restart-ts-server.js generate');
  console.log('');
  console.log('Auto-triggers: flatbuffers, generate, build, compile, regenerate, update-types');
  console.log('');
  console.log('Manual restart: Cmd+Shift+P → "TypeScript: Restart TS Server"');
}
