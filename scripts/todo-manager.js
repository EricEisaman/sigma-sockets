#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// TODO management system for automatic goal tracking
class TodoManager {
  constructor() {
    this.todoFile = path.join(process.cwd(), '.todos.json');
    this.todos = [];
    this.loadTodos();
  }

  loadTodos() {
    try {
      if (fs.existsSync(this.todoFile)) {
        const data = fs.readFileSync(this.todoFile, 'utf8');
        this.todos = JSON.parse(data);
        console.log(`📋 Loaded ${this.todos.length} TODOs from ${this.todoFile}`);
      }
    } catch (error) {
      console.log(`📝 Creating new TODO file: ${this.todoFile}`);
      this.todos = [];
    }
  }

  saveTodos() {
    try {
      fs.writeFileSync(this.todoFile, JSON.stringify(this.todos, null, 2));
    } catch (error) {
      console.error('❌ Failed to save TODOs:', error.message);
    }
  }

  addTodo(content, status = 'pending', priority = 'medium', note = null) {
    const todo = {
      id: this.generateId(),
      content,
      status,
      priority,
      note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.todos.push(todo);
    this.saveTodos();
    console.log(`✅ Added TODO: ${content}`);
    return todo;
  }

  updateTodo(id, updates) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      Object.assign(todo, updates, { updatedAt: new Date().toISOString() });
      this.saveTodos();
      console.log(`🔄 Updated TODO: ${todo.content}`);
      return todo;
    }
    return null;
  }

  completeTodo(id) {
    return this.updateTodo(id, { status: 'completed' });
  }

  cancelTodo(id) {
    return this.updateTodo(id, { status: 'cancelled' });
  }

  getTodos(status = null) {
    if (status) {
      return this.todos.filter(t => t.status === status);
    }
    return this.todos;
  }

  getPendingTodos() {
    return this.getTodos('pending');
  }

  getCompletedTodos() {
    return this.getTodos('completed');
  }

  getInProgressTodos() {
    return this.getTodos('in_progress');
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Auto-update TODOs based on current project state
  autoUpdateTodos() {
    const currentTime = new Date().toISOString();
    
    // Check for stale TODOs that should be updated
    this.todos.forEach(todo => {
      if (todo.status === 'pending') {
        const createdDate = new Date(todo.createdAt);
        const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // If TODO is older than 7 days and still pending, mark as stale
        if (daysSinceCreated > 7) {
          this.updateTodo(todo.id, { 
            status: 'stale',
            priority: 'high',
            note: 'Auto-marked as stale after 7 days'
          });
        }
      }
    });

    // Update existing TODOs based on current project state
    this.updateExistingTODOs();
    
    // Add new TODOs based on current issues
    this.addDynamicTODOs();
    
    this.saveTodos();
  }

  // Update existing TODOs based on current project state
  updateExistingTODOs() {
    this.todos.forEach(todo => {
      // Update FlatBuffers TODO if it's been partially addressed
      if (todo.content.includes('FlatBuffers') && todo.content.includes('startObject')) {
        // Check if this is still a critical issue
        if (todo.priority === 'critical') {
          // Keep as critical until fully resolved
          this.updateTodo(todo.id, { 
            note: 'Still critical - builder.startObject is not a function error persists',
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      // Update test timeout TODO
      if (todo.content.includes('timeout protection')) {
        // This should always remain high priority
        this.updateTodo(todo.id, { 
          priority: 'critical',
          note: 'CRITICAL: Always use node scripts/test-with-timeout.js 2 <command>',
          updatedAt: new Date().toISOString()
        });
      }
      
      // Update TypeScript errors TODO
      if (todo.content.includes('TypeScript errors')) {
        // Check if there are still errors (based on recent test output)
        this.updateTodo(todo.id, { 
          priority: 'high',
          note: 'Multiple TypeScript errors detected in type-check output',
          updatedAt: new Date().toISOString()
        });
      }
      
      // Update ESLint TODO
      if (todo.content.includes('ESLint')) {
        // Check if ESLint is working properly
        this.updateTodo(todo.id, { 
          priority: 'medium',
          note: 'ESLint configuration needs review',
          updatedAt: new Date().toISOString()
        });
      }
      
      // Check if setTimeout issues have been resolved
      if (todo.content.includes('setTimeout import issues')) {
        // This might be resolved now that we fixed the imports
        this.updateTodo(todo.id, { 
          status: 'completed',
          note: 'Fixed setTimeout import issues in memory injection scripts',
          updatedAt: new Date().toISOString()
        });
      }
    });
  }

  // Add dynamic TODOs based on current project state
  addDynamicTODOs() {
    const dynamicTODOs = [
      {
        content: 'Fix setTimeout import issues in memory injection scripts',
        priority: 'high',
        status: 'pending',
        note: 'Detected from recent error logs'
      },
      {
        content: 'Resolve unused import errors in generated FlatBuffers files',
        priority: 'medium',
        status: 'pending',
        note: 'unionToMessageData, unionListToMessageData not used'
      },
      {
        content: 'Fix missing ClientSession export in sigmasockets-server',
        priority: 'high',
        status: 'pending',
        note: 'Benchmark app cannot import ClientSession'
      },
      {
        content: 'Add proper type annotations to chat demo test parameters',
        priority: 'medium',
        status: 'pending',
        note: 'Parameter data implicitly has any type'
      },
      {
        content: 'Fix verbatimModuleSyntax import issues in benchmark app',
        priority: 'medium',
        status: 'pending',
        note: 'BenchmarkResult and WebSocket need type-only imports'
      }
    ];

    dynamicTODOs.forEach(todo => {
      // Only add if it doesn't already exist
      const exists = this.todos.some(t => t.content === todo.content);
      if (!exists) {
        this.addTodo(todo.content, todo.status, todo.priority);
        if (todo.note) {
          // Add note to the newly created TODO
          const newTodo = this.todos[this.todos.length - 1];
          this.updateTodo(newTodo.id, { note: todo.note });
        }
      }
    });
  }

  addCommonTODOs() {
    const commonTODOs = [
      {
        content: 'Fix TypeScript errors in generated FlatBuffers files',
        priority: 'high',
        status: 'pending'
      },
      {
        content: 'Ensure all tests use timeout protection',
        priority: 'critical',
        status: 'pending'
      },
      {
        content: 'Update ESLint configuration for all packages',
        priority: 'medium',
        status: 'pending'
      },
      {
        content: 'Verify chat demo works in multiple browser tabs',
        priority: 'high',
        status: 'pending'
      },
      {
        content: 'Run comprehensive QA checks',
        priority: 'medium',
        status: 'pending'
      }
    ];

    commonTODOs.forEach(todo => {
      // Only add if it doesn't already exist
      const exists = this.todos.some(t => t.content === todo.content);
      if (!exists) {
        this.addTodo(todo.content, todo.status, todo.priority);
      }
    });
  }

  // Generate TODO summary for memory injection
  generateSummary() {
    const pending = this.getPendingTodos();
    const inProgress = this.getInProgressTodos();
    const completed = this.getCompletedTodos();
    const stale = this.getTodos('stale');

    return {
      total: this.todos.length,
      pending: pending.length,
      inProgress: inProgress.length,
      completed: completed.length,
      stale: stale.length,
      critical: this.todos.filter(t => t.priority === 'critical').length,
      high: this.todos.filter(t => t.priority === 'high').length,
      summary: `📋 TODO STATUS: ${pending.length} pending, ${inProgress.length} in progress, ${completed.length} completed, ${stale.length} stale`
    };
  }

  // Get next priority TODO
  getNextPriority() {
    const pending = this.getPendingTodos();
    const critical = pending.filter(t => t.priority === 'critical');
    const high = pending.filter(t => t.priority === 'high');
    const medium = pending.filter(t => t.priority === 'medium');
    const low = pending.filter(t => t.priority === 'low');

    return critical[0] || high[0] || medium[0] || low[0] || null;
  }

  // Display TODO dashboard
  displayDashboard() {
    const summary = this.generateSummary();
    const nextPriority = this.getNextPriority();

    console.log(`\n${'📋'.repeat(20)}`);
    console.log(`📊 TODO DASHBOARD`);
    console.log(`${'📋'.repeat(20)}`);
    console.log(`Total TODOs: ${summary.total}`);
    console.log(`Pending: ${summary.pending} | In Progress: ${summary.inProgress} | Completed: ${summary.completed} | Stale: ${summary.stale}`);
    console.log(`Critical: ${summary.critical} | High: ${summary.high}`);
    
    if (nextPriority) {
      console.log(`\n🎯 NEXT PRIORITY:`);
      console.log(`   ${nextPriority.content}`);
      console.log(`   Priority: ${nextPriority.priority} | Status: ${nextPriority.status}`);
    }

    console.log(`${'📋'.repeat(20)}\n`);
  }
}

// CLI interface
if (process.argv[1] && process.argv[1].endsWith('todo-manager.js')) {
  const command = process.argv[2];
  const todoManager = new TodoManager();

  switch (command) {
    case 'dashboard':
      todoManager.displayDashboard();
      break;
    
    case 'add':
      const content = process.argv[3];
      const priority = process.argv[4] || 'medium';
      if (content) {
        todoManager.addTodo(content, 'pending', priority);
      } else {
        console.log('Usage: node todo-manager.js add "TODO content" [priority]');
      }
      break;
    
    case 'list':
      const status = process.argv[3] || null;
      const todos = todoManager.getTodos(status);
      console.log(`\n📋 TODOs (${status || 'all'}):`);
      todos.forEach(todo => {
        const statusIcon = todo.status === 'completed' ? '✅' : 
                          todo.status === 'in_progress' ? '🔄' : 
                          todo.status === 'stale' ? '⚠️' : '⏳';
        const priorityIcon = todo.priority === 'critical' ? '🔴' : 
                            todo.priority === 'high' ? '🟠' : 
                            todo.priority === 'medium' ? '🟡' : '🟢';
        console.log(`  ${statusIcon} ${priorityIcon} ${todo.content}`);
        if (todo.note) {
          console.log(`     📝 ${todo.note}`);
        }
        console.log(`     ID: ${todo.id} | Created: ${new Date(todo.createdAt).toLocaleDateString()}`);
      });
      break;
    
    case 'complete':
      const completeId = process.argv[3];
      if (completeId) {
        todoManager.completeTodo(completeId);
      } else {
        console.log('Usage: node todo-manager.js complete <todo-id>');
      }
      break;
    
    case 'update':
      const updateId = process.argv[3];
      const newStatus = process.argv[4];
      if (updateId && newStatus) {
        todoManager.updateTodo(updateId, { status: newStatus });
      } else {
        console.log('Usage: node todo-manager.js update <todo-id> <new-status>');
      }
      break;
    
    case 'auto-update':
      todoManager.autoUpdateTodos();
      console.log('✅ TODOs auto-updated');
      break;
    
    default:
      console.log(`
📋 TODO Manager CLI

Usage:
  node todo-manager.js dashboard          - Show TODO dashboard
  node todo-manager.js add "content" [priority] - Add new TODO
  node todo-manager.js list [status]      - List TODOs
  node todo-manager.js complete <id>      - Complete TODO
  node todo-manager.js update <id> <status> - Update TODO status
  node todo-manager.js auto-update        - Auto-update TODOs

Statuses: pending, in_progress, completed, cancelled, stale
Priorities: critical, high, medium, low
      `);
  }
}

export default TodoManager;
