#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import TodoManager from './todo-manager.js';
import CompletionTrigger from './completion-trigger.js';

// Initialize completion trigger
const completionTrigger = new CompletionTrigger();

// Memory injection patterns for AI agent activation
const MEMORY_PATTERNS = [
  {
    id: 'type-safety-activation',
    interval: 300000, // 5 minutes
    pattern: `🔒 TYPE SAFETY ACTIVATION:
    "Remember: Every 'any' type is a potential bug. 
    TypeScript strict mode is not optional - it's essential.
    Run 'npm run type-check' and fix every error.
    Your code should be so well-typed that it's self-documenting."`,
    trigger: 'type-check'
  },
  {
    id: 'code-quality-activation',
    interval: 600000, // 10 minutes
    pattern: `🎯 CODE QUALITY ACTIVATION:
    "Remember: Clean code is not just about working - it's about being maintainable.
    Every function should do one thing well.
    Error handling is not optional - it's mandatory.
    Run 'npm run lint' and fix every warning."`,
    trigger: 'lint'
  },
  {
    id: 'test-coverage-activation',
    interval: 900000, // 15 minutes
    pattern: `🧪 TEST COVERAGE ACTIVATION:
    "Remember: Untested code is broken code.
    Every public method needs a test.
    Edge cases are where bugs hide.
    CRITICAL: Always use timeout: node scripts/test-with-timeout.js 2 <command>
    Run 'npm run test:packages' and ensure 100% pass rate."`,
    trigger: 'test:packages'
  },
  {
    id: 'performance-activation',
    interval: 1200000, // 20 minutes
    pattern: `⚡ PERFORMANCE ACTIVATION:
    "Remember: SigmaSockets is about high performance.
    FlatBuffers are your secret weapon - use them properly.
    WebSocket connections must be managed efficiently.
    Run 'npm run benchmark' and optimize bottlenecks."`,
    trigger: 'benchmark'
  },
  {
    id: 'architecture-activation',
    interval: 1800000, // 30 minutes
    pattern: `🏗️ ARCHITECTURE ACTIVATION:
    "Remember: Good architecture makes everything easier.
    Separation of concerns is not optional.
    Dependencies should flow in one direction.
    Run 'npm run qa' and ensure architectural integrity."`,
    trigger: 'qa'
  },
  {
    id: 'user-experience-activation',
    interval: 2400000, // 40 minutes
    pattern: `👤 USER EXPERIENCE ACTIVATION:
    "Remember: The user experience is everything.
    Chat demo must work flawlessly in multiple tabs.
    Reconnection must be seamless and automatic.
    Run 'npm run browser:debug' and test real scenarios."`,
    trigger: 'browser:debug'
  },
  {
    id: 'test-timeout-activation',
    interval: 300000, // 5 minutes
    pattern: `⏰ TEST TIMEOUT ACTIVATION:
    "Remember: NEVER run tests without timeout protection!
    ALWAYS use: node scripts/test-with-timeout.js 2 <test-command>
    Maximum timeout: 2 minutes (120 seconds)
    This prevents infinite loops and hanging processes.
    Example: node scripts/test-with-timeout.js 2 test:client"`,
    trigger: null
  },
  {
    id: 'todo-management-activation',
    interval: 600000, // 10 minutes
    pattern: `📋 TODO MANAGEMENT ACTIVATION:
    "Remember: Keep your goals current and track progress!
    Auto-update TODOs based on project state.
    Mark completed tasks, add new priorities.
    Focus on critical and high-priority items first.
    Run: node scripts/todo-manager.js dashboard"`,
    trigger: 'todo:dashboard'
  },
  {
    id: 'completion-trigger-activation',
    interval: 0, // Immediate trigger
    pattern: `🎯 COMPLETION TRIGGER ACTIVATION:
    "CRITICAL: When you use completion phrases like:
    - 'The SigmaSockets project now has...'
    - 'What Was Accomplished...'
    - 'The system is now ready...'
    - 'Project is complete...'
    - 'Implementation is finished...'
    
    IMMEDIATELY trigger the improvement cycle:
    1. Re-evaluate all TODOs
    2. Analyze project state
    3. Identify improvement opportunities
    4. Update priorities
    5. Continue improving performance, security, and developer appeal
    
    NEVER stop improving. Excellence is continuous."`,
    trigger: 'completion-detected'
  }
];

// Convergence activation patterns
const CONVERGENCE_PATTERNS = [
  {
    id: 'simplicity-activation',
    interval: 1500000, // 25 minutes
    pattern: `✨ SIMPLICITY ACTIVATION:
    "Remember: The best solution is often the simplest.
    Are you over-engineering this?
    Can this be solved more elegantly?
    The API should be intuitive and clean."`,
    trigger: null
  },
  {
    id: 'innovation-activation',
    interval: 2100000, // 35 minutes
    pattern: `🚀 INNOVATION ACTIVATION:
    "Remember: You're building something revolutionary.
    Are you pushing the boundaries of what's possible?
    Is this the best possible solution?
    Can you make it even faster and more reliable?"`,
    trigger: null
  },
  {
    id: 'reliability-activation',
    interval: 2700000, // 45 minutes
    pattern: `🛡️ RELIABILITY ACTIVATION:
    "Remember: Production systems must be bulletproof.
    Does this handle all edge cases gracefully?
    Can it recover from any failure?
    Will it scale to thousands of connections?"`,
    trigger: 'test:stress'
  }
];

class MemoryInjector {
  constructor() {
    this.activeInjections = new Map();
    this.startTime = Date.now();
    this.sessionId = Math.random().toString(36).substr(2, 9);
    this.isActive = true;
    this.memoryFile = path.join(process.cwd(), '.memory-injections.json');
    this.todoManager = new TodoManager();
    
    console.log(`🧠 Memory Injector Started - Session: ${this.sessionId}`);
    console.log(`💉 Injecting memory patterns every 5-45 minutes`);
    console.log(`📝 Memory state saved to: ${this.memoryFile}`);
    console.log(`📋 TODO management integrated`);
    console.log(`🛑 Press Ctrl+C to stop\n`);
    
    this.loadMemoryState();
  }

  loadMemoryState() {
    try {
      if (fs.existsSync(this.memoryFile)) {
        const data = fs.readFileSync(this.memoryFile, 'utf8');
        const state = JSON.parse(data);
        console.log(`📖 Loaded memory state: ${state.injections} injections, ${state.lastUpdate}`);
      }
    } catch (error) {
      console.log(`📝 Creating new memory state file`);
    }
  }

  saveMemoryState() {
    const state = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      injections: this.activeInjections.size,
      lastUpdate: new Date().toISOString(),
      patterns: Array.from(this.activeInjections.keys())
    };
    
    try {
      fs.writeFileSync(this.memoryFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('❌ Failed to save memory state:', error.message);
    }
  }

  start() {
    // Start all memory injection patterns
    MEMORY_PATTERNS.forEach(pattern => {
      this.scheduleInjection(pattern, 'core');
    });

    CONVERGENCE_PATTERNS.forEach(pattern => {
      this.scheduleInjection(pattern, 'convergence');
    });

    // Initial memory dump
    this.dumpMemory();
  }

  scheduleInjection(pattern, category) {
    const executeInjection = async () => {
      if (!this.isActive) return;

      const elapsed = Math.round((Date.now() - this.startTime) / 1000 / 60);
      
      // Create memory injection
      const injection = {
        id: pattern.id,
        category: category,
        timestamp: Date.now(),
        elapsed: elapsed,
        pattern: pattern.pattern,
        trigger: pattern.trigger
      };

      this.activeInjections.set(pattern.id, injection);
      this.saveMemoryState();

      // Display the memory injection
      console.log(`\n${'🧠'.repeat(20)}`);
      console.log(`💉 MEMORY INJECTION [${category.toUpperCase()}] - ${elapsed} minutes elapsed`);
      console.log(`${'🧠'.repeat(20)}`);
      console.log(pattern.pattern);
      console.log(`${'🧠'.repeat(20)}\n`);

      // Check for completion trigger
      if (completionTrigger.detectCompletion(pattern.pattern)) {
        console.log('🎯 COMPLETION PHRASE DETECTED - TRIGGERING IMPROVEMENT CYCLE');
        await completionTrigger.triggerImprovementCycle();
      }

      // Auto-update TODOs on every injection
      this.todoManager.autoUpdateTodos();
      const todoSummary = this.todoManager.generateSummary();
      console.log(`📋 ${todoSummary.summary}`);

      // Execute trigger if specified
      if (pattern.trigger) {
        console.log(`⚡ Triggering action: npm run ${pattern.trigger}`);
        await this.executeTrigger(pattern.trigger);
      }

      // Schedule next injection
      if (this.isActive) {
        setTimeout(() => executeInjection(), pattern.interval);
      }
    };

    // Start the first injection
    setTimeout(() => executeInjection(), pattern.interval);
  }

  async executeTrigger(trigger) {
    return new Promise((resolve) => {
      // Handle special TODO dashboard trigger
      if (trigger === 'todo:dashboard') {
        this.todoManager.displayDashboard();
        resolve();
        return;
      }

      const childProcess = spawn('npm', ['run', trigger], {
        stdio: 'inherit',
        shell: true
      });

      // Timeout after 2 minutes
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Trigger ${trigger} timed out after 2 minutes`);
        childProcess.kill('SIGTERM');
        resolve();
      }, 120000);

      childProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        console.log(`✅ Trigger ${trigger} completed with code ${code}\n`);
        resolve();
      });
    });
  }

  dumpMemory() {
    console.log(`📊 MEMORY INJECTOR STATUS:`);
    console.log(`   Core Patterns: ${MEMORY_PATTERNS.length} active`);
    console.log(`   Convergence Patterns: ${CONVERGENCE_PATTERNS.length} active`);
    console.log(`   Session ID: ${this.sessionId}`);
    console.log(`   Started: ${new Date(this.startTime).toLocaleTimeString()}`);
    console.log(`   Memory File: ${this.memoryFile}\n`);
  }

  stop() {
    console.log(`\n🛑 Stopping Memory Injector...`);
    this.isActive = false;
    this.saveMemoryState();
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  if (global.memoryInjector) {
    global.memoryInjector.stop();
  }
});

// Start the memory injector
const memoryInjector = new MemoryInjector();
global.memoryInjector = memoryInjector;
memoryInjector.start();

// Keep the process running
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  memoryInjector.stop();
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  memoryInjector.stop();
});
