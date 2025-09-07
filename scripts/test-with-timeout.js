#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import { checkAndActivate } from './auto-activate.js';

const timeoutInMinutes = parseInt(process.argv[2]) || 1;
const timeoutInMs = timeoutInMinutes * 60 * 1000;

console.log(`🚀 Starting test with ${timeoutInMinutes} minute timeout...`);

const testCommand = process.argv[3] || 'test:client';

// Auto-activate reminder system for tests
checkAndActivate(`npm run ${testCommand}`);
const testProcess = spawn('npm', ['run', testCommand], {
  stdio: 'inherit',
  shell: true
});

// Set up timeout
const timeoutPromise = setTimeout(timeoutInMs).then(() => {
  console.log(`\n⏰ Test timed out after ${timeoutInMinutes} minute(s). Killing process...`);
  testProcess.kill('SIGTERM');
  process.exit(1);
});

// Wait for test to complete or timeout
Promise.race([
  new Promise((resolve, reject) => {
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Tests completed successfully!');
        resolve(code);
      } else {
        console.log(`❌ Tests failed with exit code ${code}`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });
    
    testProcess.on('error', (error) => {
      console.log(`❌ Test process error: ${error.message}`);
      reject(error);
    });
  }),
  timeoutPromise
]).catch((error) => {
  console.error('Test execution failed:', error.message);
  process.exit(1);
});
