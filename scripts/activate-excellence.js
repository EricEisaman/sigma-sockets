#!/usr/bin/env node

import { spawn } from 'child_process';

console.log(`
🧠 SIGMASOCKETS EXCELLENCE ACTIVATION SYSTEM
${'='.repeat(60)}

This system will continuously remind you to maintain the highest standards
while driving towards a brilliant solution. It combines:

🔒 Type Safety Enforcement
🎯 Code Quality Standards  
🧪 Test Coverage Requirements
⚡ Performance Optimization
🏗️ Architectural Integrity
👤 User Experience Excellence
✨ Simplicity Principles
🚀 Innovation Drive
🛡️ Reliability Standards

The system will inject memory patterns and execute quality checks
at regular intervals to ensure continuous improvement.

${'='.repeat(60)}
`);

class ExcellenceActivator {
  constructor() {
    this.processes = new Map();
    this.startTime = Date.now();
    this.sessionId = Math.random().toString(36).substr(2, 9);
    this.isActive = true;
    
    console.log(`🚀 Starting Excellence Activation - Session: ${this.sessionId}`);
    console.log(`⏰ Memory injections every 5-45 minutes`);
    console.log(`🔍 Quality checks every 5-40 minutes`);
    console.log(`🛑 Press Ctrl+C to stop all systems\n`);
  }

  async start() {
    try {
      // Start the memory injector
      console.log('💉 Starting Memory Injector...');
      const memoryProcess = spawn('node', ['scripts/memory-injector.js'], {
        stdio: 'inherit',
        shell: true
      });
      this.processes.set('memory', memoryProcess);

      // Wait a moment for memory system to initialize
      await new Promise(resolve => setTimeout(() => resolve(), 2000));

      // Start the reminder system
      console.log('🧠 Starting Reminder System...');
      const reminderProcess = spawn('node', ['scripts/reminder-system.js'], {
        stdio: 'inherit',
        shell: true
      });
      this.processes.set('reminders', reminderProcess);

      // Wait a moment for reminder system to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start browser monitoring
      console.log('👀 Starting Browser Console Monitor...');
      const browserProcess = spawn('node', ['scripts/browser-console-monitor.js'], {
        stdio: 'inherit',
        shell: true
      });
      this.processes.set('browser', browserProcess);

      console.log('\n✅ All systems activated!');
      console.log('📊 Monitoring: Type safety, code quality, tests, performance, architecture, UX');
      console.log('🎯 Driving towards: Brilliant, simple, innovative, reliable solution');
      console.log('💡 The system will continuously guide you towards excellence\n');

      // Keep the main process alive
      await new Promise(() => {});

    } catch (error) {
      console.error('❌ Failed to start excellence activation:', error.message);
      this.stop();
    }
  }

  stop() {
    console.log('\n🛑 Stopping Excellence Activation System...');
    this.isActive = false;
    
    this.processes.forEach((process, name) => {
      console.log(`   Stopping ${name}...`);
      process.kill('SIGTERM');
    });
    
    console.log('✅ All systems stopped');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  if (global.excellenceActivator) {
    global.excellenceActivator.stop();
  }
});

// Start the excellence activator
const excellenceActivator = new ExcellenceActivator();
global.excellenceActivator = excellenceActivator;
excellenceActivator.start();

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  excellenceActivator.stop();
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  excellenceActivator.stop();
});
