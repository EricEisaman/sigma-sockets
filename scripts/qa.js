#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import { checkAndActivate } from './auto-activate.js';

const timeoutInMinutes = parseInt(process.argv[2]) || 10; // Default 10 minutes for full QA
const timeoutInMs = timeoutInMinutes * 60 * 1000;

console.log(`🚀 Starting comprehensive QA with ${timeoutInMinutes} minute timeout...`);
console.log('📋 Running: Type checks + Lint checks + Tests for all packages and demos\n');

// Auto-activate reminder system for QA
checkAndActivate('npm run qa');

// Define all QA steps
const qaSteps = [
  {
    name: 'Type Checks',
    command: 'type-check',
    description: 'TypeScript compilation check across all workspaces'
  },
  {
    name: 'Lint Checks', 
    command: 'lint',
    description: 'ESLint check across all workspaces'
  },
  {
    name: 'Package Tests',
    command: 'test:packages',
    description: 'Tests for all packages (types, client, server)'
  },
  {
    name: 'Demo Tests',
    command: 'test:apps',
    description: 'Tests for all demos and apps (chat, benchmark)'
  }
];

let currentStepIndex = 0;
let hasErrors = false;

async function runQAStep(step) {
  console.log(`\n🔍 Step ${currentStepIndex + 1}/${qaSteps.length}: ${step.name}`);
  console.log(`📝 ${step.description}`);
  console.log(`⚡ Running: ${step.command}\n`);

  return new Promise((resolve, reject) => {
    const process = spawn('npm', ['run', step.command], {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${step.name} completed successfully!\n`);
        resolve(true);
      } else {
        console.log(`❌ ${step.name} failed with exit code ${code}\n`);
        hasErrors = true;
        resolve(false);
      }
    });

    process.on('error', (error) => {
      console.log(`❌ ${step.name} process error: ${error.message}\n`);
      hasErrors = true;
      resolve(false);
    });
  });
}

async function runFullQA() {
  const startTime = Date.now();
  
  try {
    // Run all QA steps sequentially
    for (const step of qaSteps) {
      const success = await runQAStep(step);
      currentStepIndex++;
      
      if (!success) {
        console.log(`\n💥 QA failed at step: ${step.name}`);
        console.log('🛑 Stopping QA process due to failure\n');
        break;
      }
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    if (hasErrors) {
      console.log('❌ QA COMPLETED WITH ERRORS');
      console.log(`⏱️  Total duration: ${duration}s`);
      console.log('🔧 Please fix the errors above and run QA again\n');
      process.exit(1);
    } else {
      console.log('🎉 QA COMPLETED SUCCESSFULLY!');
      console.log(`⏱️  Total duration: ${duration}s`);
      console.log('✨ All type checks, lint checks, and tests passed!\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 QA process crashed:', error.message);
    process.exit(1);
  }
}

// Set up timeout
const timeoutPromise = setTimeout(timeoutInMs).then(() => {
  console.log(`\n⏰ QA timed out after ${timeoutInMinutes} minute(s).`);
  console.log('🛑 This usually indicates a hanging process or infinite loop.\n');
  process.exit(1);
});

// Run QA with timeout protection
Promise.race([runFullQA(), timeoutPromise]).catch((error) => {
  console.error('QA execution failed:', error.message);
  process.exit(1);
});
