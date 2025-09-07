#!/usr/bin/env node

import { spawn } from 'child_process';
import { checkAndActivate } from './auto-activate.js';

async function runAutoTest() {
  // Get the command to run
  const command = process.argv.slice(2).join(' ');

  if (!command) {
    console.log('❌ No command provided');
    console.log('Usage: node scripts/auto-test.js <npm-command>');
    process.exit(1);
  }

  console.log(`🤖 Auto-Test Wrapper: ${command}`);

  // Auto-activate reminder system
  checkAndActivate(`npm run ${command}`);

  // Wait a moment for activation
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Run the actual command
  const childProcess = spawn('npm', ['run', ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: true
  });

  childProcess.on('close', (code) => {
    console.log(`\n✅ Command completed with exit code: ${code}`);
    process.exit(code);
  });

  childProcess.on('error', (error) => {
    console.error(`❌ Command failed: ${error.message}`);
    process.exit(1);
  });
}

runAutoTest().catch(console.error);
