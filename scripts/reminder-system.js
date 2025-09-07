#!/usr/bin/env node

import { spawn } from 'child_process';

// Core Reminders for SigmaSockets Excellence
const CORE_REMINDERS = [
  {
    id: 'type-safety',
    interval: 300000, // 5 minutes
    message: `🔒 TYPE SAFETY CHECK: Are all TypeScript types properly defined? 
    - Check for 'any' types that should be specific
    - Ensure all imports use 'import type' where appropriate
    - Verify all function parameters and returns are typed
    - Run: npm run type-check`,
    action: 'type-check'
  },
  {
    id: 'code-quality',
    interval: 600000, // 10 minutes
    message: `🎯 CODE QUALITY CHECK: Is the code following our standards?
    - No console.log in production code
    - Proper error handling with try/catch
    - Consistent naming conventions
    - Run: npm run lint`,
    action: 'lint'
  },
  {
    id: 'test-coverage',
    interval: 900000, // 15 minutes
    message: `🧪 TEST COVERAGE CHECK: Are we testing everything important?
    - All public methods have tests
    - Edge cases are covered
    - Mocks are properly implemented
    - CRITICAL: Always use timeout: node scripts/test-with-timeout.js 2 <command>
    - Run: npm run test:packages`,
    action: 'test:packages'
  },
  {
    id: 'performance',
    interval: 1200000, // 20 minutes
    message: `⚡ PERFORMANCE CHECK: Is the code optimized?
    - FlatBuffers are being used efficiently
    - WebSocket connections are properly managed
    - Memory leaks are prevented
    - Run: npm run benchmark`,
    action: 'benchmark'
  },
  {
    id: 'architecture',
    interval: 1800000, // 30 minutes
    message: `🏗️ ARCHITECTURE CHECK: Is the design solid?
    - Separation of concerns is maintained
    - Dependencies are properly managed
    - Error boundaries are in place
    - Run: npm run qa`,
    action: 'qa'
  },
  {
    id: 'user-experience',
    interval: 2400000, // 40 minutes
    message: `👤 USER EXPERIENCE CHECK: Does it work flawlessly?
    - Chat demo works in multiple tabs
    - Reconnection logic is robust
    - Error messages are user-friendly
    - Run: npm run browser:debug`,
    action: 'browser:debug'
  },
  {
    id: 'test-timeout-enforcement',
    interval: 300000, // 5 minutes
    message: `⏰ TEST TIMEOUT ENFORCEMENT: Are you using timeout protection?
    - NEVER run tests without timeout: node scripts/test-with-timeout.js 2 <command>
    - Maximum timeout: 2 minutes (120 seconds)
    - This prevents infinite loops and hanging processes
    - Example: node scripts/test-with-timeout.js 2 test:client`,
    action: null
  }
];

// Convergence Reminders - Drive towards brilliant solution
const CONVERGENCE_REMINDERS = [
  {
    id: 'simplicity',
    interval: 1500000, // 25 minutes
    message: `✨ SIMPLICITY CHECK: Are we over-engineering?
    - Can this be solved more simply?
    - Are we following the principle of least surprise?
    - Is the API intuitive and clean?`,
    action: null
  },
  {
    id: 'innovation',
    interval: 2100000, // 35 minutes
    message: `🚀 INNOVATION CHECK: Are we pushing boundaries?
    - Is this the best possible solution?
    - Are we leveraging FlatBuffers optimally?
    - Can we make it even faster/more reliable?`,
    action: null
  },
  {
    id: 'reliability',
    interval: 2700000, // 45 minutes
    message: `🛡️ RELIABILITY CHECK: Is it production-ready?
    - Handles all edge cases gracefully
    - Recovers from failures automatically
    - Scales to thousands of connections
    - Run: npm run test:stress`,
    action: 'test:stress'
  }
];

class ReminderSystem {
  constructor() {
    this.activeReminders = new Map();
    this.startTime = Date.now();
    this.sessionId = Math.random().toString(36).substr(2, 9);
    this.isActive = true;
    
    console.log(`🧠 Reminder System Started - Session: ${this.sessionId}`);
    console.log(`⏰ Core reminders every 5-40 minutes`);
    console.log(`🎯 Convergence reminders every 25-45 minutes`);
    console.log(`🛑 Press Ctrl+C to stop\n`);
  }

  start() {
    // Start all core reminders
    CORE_REMINDERS.forEach(reminder => {
      this.scheduleReminder(reminder, 'core');
    });

    // Start all convergence reminders
    CONVERGENCE_REMINDERS.forEach(reminder => {
      this.scheduleReminder(reminder, 'convergence');
    });

    // Initial status check
    this.showStatus();
  }

  scheduleReminder(reminder, category) {
    const executeReminder = async () => {
      if (!this.isActive) return;

      const elapsed = Math.round((Date.now() - this.startTime) / 1000 / 60);
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧠 REMINDER [${category.toUpperCase()}] - ${elapsed} minutes elapsed`);
      console.log(`${'='.repeat(80)}`);
      console.log(reminder.message);
      console.log(`${'='.repeat(80)}\n`);

      // Execute action if specified
      if (reminder.action) {
        console.log(`⚡ Executing: npm run ${reminder.action}`);
        await this.executeAction(reminder.action);
      }

      // Schedule next occurrence
      if (this.isActive) {
        setTimeout(() => executeReminder(), reminder.interval);
      }
    };

    // Start the first execution
    setTimeout(() => executeReminder(), reminder.interval);
  }

  async executeAction(action) {
    return new Promise((resolve) => {
      const childProcess = spawn('npm', ['run', action], {
        stdio: 'inherit',
        shell: true
      });

      // Timeout after 2 minutes for any action
      const timeoutId = setTimeout(120000).then(() => {
        console.log(`⏰ Action ${action} timed out after 2 minutes`);
        childProcess.kill('SIGTERM');
        resolve();
      });

      childProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        console.log(`✅ Action ${action} completed with code ${code}\n`);
        resolve();
      });
    });
  }

  showStatus() {
    console.log(`📊 REMINDER SYSTEM STATUS:`);
    console.log(`   Core Reminders: ${CORE_REMINDERS.length} active`);
    console.log(`   Convergence Reminders: ${CONVERGENCE_REMINDERS.length} active`);
    console.log(`   Session ID: ${this.sessionId}`);
    console.log(`   Started: ${new Date(this.startTime).toLocaleTimeString()}\n`);
  }

  stop() {
    console.log(`\n🛑 Stopping Reminder System...`);
    this.isActive = false;
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  if (global.reminderSystem) {
    global.reminderSystem.stop();
  }
});

// Start the reminder system
const reminderSystem = new ReminderSystem();
global.reminderSystem = reminderSystem;
reminderSystem.start();

// Keep the process running
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  reminderSystem.stop();
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  reminderSystem.stop();
});
