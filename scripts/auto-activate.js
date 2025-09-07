#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import TodoManager from './todo-manager.js';

// Auto-activation triggers
const ACTIVATION_TRIGGERS = [
  'test',
  'qa',
  'type-check',
  'lint',
  'build',
  'dev',
  'browser:',
  'benchmark'
];

// Memory patterns for immediate activation
const IMMEDIATE_MEMORY_PATTERNS = [
  {
    id: 'immediate-type-safety',
    pattern: `🔒 IMMEDIATE TYPE SAFETY CHECK:
    "You're about to run tests or respond to requests. 
    Ensure all TypeScript types are properly defined.
    No 'any' types allowed. Run type-check if needed.
    CRITICAL: Always use timeout for tests: node scripts/test-with-timeout.js 2 <command>"`,
    trigger: 'type-check'
  },
  {
    id: 'immediate-code-quality',
    pattern: `🎯 IMMEDIATE CODE QUALITY CHECK:
    "Before proceeding, ensure code quality standards.
    Clean code, proper error handling, no console.log.
    Run lint if needed."`,
    trigger: 'lint'
  },
  {
    id: 'immediate-test-coverage',
    pattern: `🧪 IMMEDIATE TEST COVERAGE CHECK:
    "Tests are running. Ensure all critical paths are covered.
    Edge cases matter. Mocks must be proper.
    ALWAYS use: node scripts/test-with-timeout.js 2 <test-command>
    NEVER run tests without timeout protection!"`,
    trigger: null
  },
  {
    id: 'immediate-performance',
    pattern: `⚡ IMMEDIATE PERFORMANCE CHECK:
    "SigmaSockets performance is critical.
    FlatBuffers must be optimized. WebSocket efficiency matters."`,
    trigger: null
  },
  {
    id: 'immediate-test-timeout',
    pattern: `⏰ CRITICAL TEST TIMEOUT REMINDER:
    "NEVER run tests without timeout protection!
    ALWAYS use: node scripts/test-with-timeout.js 2 <test-command>
    Maximum timeout: 2 minutes (120 seconds)
    This prevents infinite loops and hanging processes!"`,
    trigger: null
  }
];

class AutoActivator {
  constructor() {
    this.isActive = false;
    this.processes = new Map();
    this.activationFile = path.join(process.cwd(), '.auto-activation.json');
    this.startTime = Date.now();
    this.todoManager = new TodoManager();
    
    console.log('🤖 Auto-Activation System Initialized');
    this.loadActivationState();
  }

  loadActivationState() {
    try {
      if (fs.existsSync(this.activationFile)) {
        const data = fs.readFileSync(this.activationFile, 'utf8');
        const state = JSON.parse(data);
        console.log(`📖 Loaded activation state: ${state.activations} activations`);
      }
    } catch (error) {
      console.log('📝 Creating new activation state file');
    }
  }

  saveActivationState(trigger, action) {
    const state = {
      lastActivation: new Date().toISOString(),
      trigger: trigger,
      action: action,
      activations: (this.getActivationCount() + 1)
    };
    
    try {
      fs.writeFileSync(this.activationFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('❌ Failed to save activation state:', error.message);
    }
  }

  getActivationCount() {
    try {
      if (fs.existsSync(this.activationFile)) {
        const data = fs.readFileSync(this.activationFile, 'utf8');
        const state = JSON.parse(data);
        return state.activations || 0;
      }
    } catch (error) {
      // Ignore errors
    }
    return 0;
  }

  shouldActivate(command) {
    return ACTIVATION_TRIGGERS.some(trigger => 
      command.includes(trigger) || command.includes(`npm run ${trigger}`)
    );
  }

  async activate(trigger, command) {
    if (this.isActive) {
      console.log('🧠 Reminder system already active');
      return;
    }

    console.log(`\n${'🧠'.repeat(20)}`);
    console.log(`🤖 AUTO-ACTIVATION TRIGGERED`);
    console.log(`📝 Command: ${command}`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    console.log(`${'🧠'.repeat(20)}\n`);

    // Auto-update TODOs
    this.todoManager.autoUpdateTodos();
    const todoSummary = this.todoManager.generateSummary();
    console.log(`📋 ${todoSummary.summary}`);

    // Inject immediate memory patterns
    this.injectImmediateMemory();

    // Start the reminder system
    await this.startReminderSystem();

    this.saveActivationState(trigger, command);
  }

  injectImmediateMemory() {
    console.log('💉 Injecting immediate memory patterns...\n');
    
    IMMEDIATE_MEMORY_PATTERNS.forEach((pattern, index) => {
      setTimeout(() => {
        console.log(`🧠 IMMEDIATE MEMORY INJECTION ${index + 1}:`);
        console.log(pattern.pattern);
        console.log('');
        
        if (pattern.trigger) {
          console.log(`⚡ Triggering: npm run ${pattern.trigger}`);
          this.executeTrigger(pattern.trigger);
        }
      }, index * 1000); // Stagger injections
    });
  }

  async startReminderSystem() {
    try {
      console.log('🚀 Starting reminder system...');
      
      // Start memory injector
      const memoryProcess = spawn('node', ['scripts/memory-injector.js'], {
        stdio: 'pipe',
        shell: true
      });
      
      this.processes.set('memory', memoryProcess);
      this.isActive = true;

      // Start reminder system
      const reminderProcess = spawn('node', ['scripts/reminder-system.js'], {
        stdio: 'pipe',
        shell: true
      });
      
      this.processes.set('reminders', reminderProcess);

      console.log('✅ Reminder system activated');
      console.log('🧠 Memory injections will continue in background\n');

    } catch (error) {
      console.error('❌ Failed to start reminder system:', error.message);
    }
  }

  async executeTrigger(trigger) {
    return new Promise((resolve) => {
      const childProcess = spawn('npm', ['run', trigger], {
        stdio: 'inherit',
        shell: true
      });

      const timeoutId = setTimeout(() => {
        console.log(`⏰ Trigger ${trigger} timed out after 1 minute`);
        childProcess.kill('SIGTERM');
        resolve();
      }, 60000);

      childProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        console.log(`✅ Trigger ${trigger} completed with code ${code}\n`);
        resolve();
      });
    });
  }

  stop() {
    console.log('\n🛑 Stopping auto-activation system...');
    this.isActive = false;
    
    this.processes.forEach((process, name) => {
      console.log(`   Stopping ${name}...`);
      process.kill('SIGTERM');
    });
    
    console.log('✅ Auto-activation stopped');
  }
}

// Global auto-activator instance
let autoActivator = null;

// Function to check and activate
export function checkAndActivate(command) {
  if (!autoActivator) {
    autoActivator = new AutoActivator();
  }
  
  if (autoActivator.shouldActivate(command)) {
    autoActivator.activate('command', command);
  }
}

// Function to activate for user requests
export function activateForUserRequest() {
  if (!autoActivator) {
    autoActivator = new AutoActivator();
  }
  
  console.log('👤 User request detected - activating reminder system');
  autoActivator.activate('user-request', 'User request');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  if (autoActivator) {
    autoActivator.stop();
  }
  process.exit(0);
});

// Export for use in other scripts
export { AutoActivator };
