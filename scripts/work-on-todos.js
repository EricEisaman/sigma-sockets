#!/usr/bin/env node

/**
 * Work on TODOs Script
 * This script actually works on the highest priority TODOs with self-monitoring
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

class TodoWorker {
    constructor() {
        this.projectDir = process.cwd();
        this.todoFile = path.join(this.projectDir, '.todos.json');
        this.progressFile = path.join(this.projectDir, '.todo-progress.json');
        this.stallTimeout = 60000; // 1 minute in milliseconds
        this.lastProgressTime = Date.now();
        this.progressCheckInterval = null;
        this.isStalling = false;
        this.currentTask = null;
        this.progressHistory = [];
    }

    // Load TODOs
    loadTodos() {
        if (!existsSync(this.todoFile)) {
            return [];
        }
        try {
            const data = readFileSync(this.todoFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading TODOs:', error.message);
            return [];
        }
    }

    // Get highest priority TODO
    getHighestPriorityTodo() {
        const todos = this.loadTodos();
        if (todos.length === 0) {
            return null;
        }

        // Sort by priority and status
        const sortedTodos = todos.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
            
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return statusOrder[a.status] - statusOrder[b.status];
        });

        return sortedTodos[0];
    }

    // Start progress monitoring
    startProgressMonitoring() {
        console.log('🔍 Starting progress monitoring...');
        this.lastProgressTime = Date.now();
        this.isStalling = false;
        
        this.progressCheckInterval = setInterval(() => {
            this.checkProgress();
        }, 10000); // Check every 10 seconds
    }

    // Stop progress monitoring
    stopProgressMonitoring() {
        if (this.progressCheckInterval) {
            clearInterval(this.progressCheckInterval);
            this.progressCheckInterval = null;
        }
        console.log('🛑 Progress monitoring stopped');
    }

    // Check if making productive advances
    checkProgress() {
        const now = Date.now();
        const timeSinceLastProgress = now - this.lastProgressTime;
        
        // Record current progress
        const progressEntry = {
            timestamp: now,
            task: this.currentTask,
            timeSinceLastProgress: timeSinceLastProgress,
            isStalling: timeSinceLastProgress > this.stallTimeout
        };
        
        this.progressHistory.push(progressEntry);
        
        // Keep only last 10 progress entries
        if (this.progressHistory.length > 10) {
            this.progressHistory = this.progressHistory.slice(-10);
        }
        
        // Save progress to file
        this.saveProgress();
        
        if (timeSinceLastProgress > this.stallTimeout) {
            console.log(`⚠️  STALLING DETECTED: No progress for ${Math.round(timeSinceLastProgress / 1000)}s`);
            this.isStalling = true;
            this.handleStalling();
        } else {
            console.log(`✅ Making progress: ${Math.round(timeSinceLastProgress / 1000)}s since last update`);
        }
    }

    // Handle stalling situation
    handleStalling() {
        console.log('🛑 STALLING DETECTED - Terminating work...');
        this.stopProgressMonitoring();
        
        // Mark current task as stalled
        if (this.currentTask) {
            console.log(`❌ Task "${this.currentTask}" stalled and terminated`);
        }
        
        // Save stall information
        const stallInfo = {
            timestamp: new Date().toISOString(),
            task: this.currentTask,
            stallDuration: Date.now() - this.lastProgressTime,
            progressHistory: this.progressHistory
        };
        
        writeFileSync(
            path.join(this.projectDir, '.stall-info.json'),
            JSON.stringify(stallInfo, null, 2)
        );
        
        process.exit(1); // Terminate the process
    }

    // Update progress
    updateProgress(task, message) {
        this.currentTask = task;
        this.lastProgressTime = Date.now();
        console.log(`📈 Progress: ${task} - ${message}`);
    }

    // Save progress to file
    saveProgress() {
        const progressData = {
            timestamp: new Date().toISOString(),
            currentTask: this.currentTask,
            lastProgressTime: this.lastProgressTime,
            isStalling: this.isStalling,
            progressHistory: this.progressHistory.slice(-5) // Keep last 5 entries
        };
        
        writeFileSync(this.progressFile, JSON.stringify(progressData, null, 2));
    }

    // Load progress from file
    loadProgress() {
        if (existsSync(this.progressFile)) {
            try {
                const data = readFileSync(this.progressFile, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                console.error('Error loading progress:', error.message);
            }
        }
        return null;
    }

    // Work on a specific TODO
    workOnTodo(todo) {
        console.log(`🔧 Working on TODO: ${todo.content}`);
        console.log(`   Priority: ${todo.priority} | Status: ${todo.status}`);
        
        // Start progress monitoring
        this.startProgressMonitoring();
        
        try {
            // Mark as in progress
            this.updateProgress('Status Update', 'Marking TODO as in progress');
            execSync(`node scripts/todo-manager.js update "${todo.id}" "${todo.content}" --status in_progress`, { 
                stdio: 'inherit',
                timeout: 10000 // 10 second timeout
            });
            
            // Determine what to do based on TODO content
            if (todo.content.includes('FlatBuffers') || todo.content.includes('builder.startObject')) {
                this.fixFlatBuffersIssue();
            } else if (todo.content.includes('test coverage')) {
                this.improveTestCoverage();
            } else if (todo.content.includes('type check') || todo.content.includes('TypeScript')) {
                this.fixTypeScriptIssues();
            } else if (todo.content.includes('lint')) {
                this.fixLintIssues();
            } else {
                console.log('🤔 TODO type not recognized, running general improvement...');
                this.runGeneralImprovement();
            }
            
            // Mark as completed
            this.updateProgress('Completion', 'Marking TODO as completed');
            execSync(`node scripts/todo-manager.js complete "${todo.id}"`, { 
                stdio: 'inherit',
                timeout: 10000 // 10 second timeout
            });
            
        } catch (error) {
            console.error('Error working on TODO:', error.message);
            this.updateProgress('Error', `Error: ${error.message}`);
        } finally {
            // Stop progress monitoring
            this.stopProgressMonitoring();
        }
    }

    // Fix FlatBuffers issues
    fixFlatBuffersIssue() {
        console.log('🔧 Fixing FlatBuffers builder.startObject issue...');
        
        try {
            // Regenerate FlatBuffers
            this.updateProgress('FlatBuffers Generation', 'Regenerating FlatBuffers files');
            execSync('npm run generate:flatbuffers', { 
                stdio: 'inherit',
                timeout: 30000 // 30 second timeout
            });
            console.log('✅ FlatBuffers regenerated');
            
            // Run tests to verify fix
            this.updateProgress('Test Verification', 'Running tests to verify FlatBuffers fix');
            execSync('npm run test', { 
                stdio: 'inherit',
                timeout: 60000 // 60 second timeout
            });
            console.log('✅ Tests passed after FlatBuffers fix');
            
        } catch (error) {
            console.error('❌ Error fixing FlatBuffers issue:', error.message);
            this.updateProgress('Error', `FlatBuffers fix failed: ${error.message}`);
        }
    }

    // Improve test coverage
    improveTestCoverage() {
        console.log('🔧 Improving test coverage...');
        
        try {
            // Run tests with coverage
            this.updateProgress('Test Coverage', 'Running tests with coverage analysis');
            execSync('npm run test -- --coverage', { 
                stdio: 'inherit',
                timeout: 60000 // 60 second timeout
            });
            console.log('✅ Test coverage analysis completed');
            
        } catch (error) {
            console.error('❌ Error improving test coverage:', error.message);
            this.updateProgress('Error', `Test coverage failed: ${error.message}`);
        }
    }

    // Fix TypeScript issues
    fixTypeScriptIssues() {
        console.log('🔧 Fixing TypeScript issues...');
        
        try {
            // Run type check
            this.updateProgress('TypeScript Check', 'Running type check to identify issues');
            execSync('npm run type-check', { 
                stdio: 'inherit',
                timeout: 30000 // 30 second timeout
            });
            console.log('✅ TypeScript issues identified and fixed');
            
        } catch (error) {
            console.error('❌ Error fixing TypeScript issues:', error.message);
            this.updateProgress('Error', `TypeScript fix failed: ${error.message}`);
        }
    }

    // Fix lint issues
    fixLintIssues() {
        console.log('🔧 Fixing lint issues...');
        
        try {
            // Run lint with auto-fix
            this.updateProgress('Lint Fix', 'Running lint with auto-fix');
            execSync('npm run lint -- --fix', { 
                stdio: 'inherit',
                timeout: 30000 // 30 second timeout
            });
            console.log('✅ Lint issues fixed');
            
        } catch (error) {
            console.error('❌ Error fixing lint issues:', error.message);
            this.updateProgress('Error', `Lint fix failed: ${error.message}`);
        }
    }

    // Run general improvement
    runGeneralImprovement() {
        console.log('🔧 Running general improvement...');
        
        try {
            // Run all checks
            this.updateProgress('Type Check', 'Running TypeScript type check');
            execSync('npm run type-check', { 
                stdio: 'inherit',
                timeout: 30000 // 30 second timeout
            });
            
            this.updateProgress('Lint Check', 'Running ESLint');
            execSync('npm run lint', { 
                stdio: 'inherit',
                timeout: 30000 // 30 second timeout
            });
            
            this.updateProgress('Test Run', 'Running test suite');
            execSync('npm run test', { 
                stdio: 'inherit',
                timeout: 60000 // 60 second timeout
            });
            
            console.log('✅ General improvement completed');
            
        } catch (error) {
            console.error('❌ Error in general improvement:', error.message);
            this.updateProgress('Error', `General improvement failed: ${error.message}`);
        }
    }

    // Cleanup method
    cleanup() {
        this.stopProgressMonitoring();
        
        // Clean up progress files
        const files = [this.progressFile, path.join(this.projectDir, '.stall-info.json')];
        files.forEach(file => {
            if (existsSync(file)) {
                try {
                    require('fs').unlinkSync(file);
                    console.log(`🗑️  Cleaned up: ${file}`);
                } catch (error) {
                    console.log(`⚠️  Could not clean up: ${file}`);
                }
            }
        });
    }

    // Main work function
    work() {
        console.log('🔧 TODO WORKER WITH SELF-MONITORING');
        console.log('===================================');
        
        // Set up cleanup on exit
        process.on('SIGINT', () => {
            console.log('\n🛑 Received SIGINT, cleaning up...');
            this.cleanup();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Received SIGTERM, cleaning up...');
            this.cleanup();
            process.exit(0);
        });
        
        const todo = this.getHighestPriorityTodo();
        if (!todo) {
            console.log('❌ No TODOs found to work on');
            return false;
        }

        this.workOnTodo(todo);
        return true;
    }
}

// CLI interface
if (process.argv[1] && process.argv[1].endsWith('work-on-todos.js')) {
    const worker = new TodoWorker();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'work':
            worker.work();
            break;
        case 'list':
            const todos = worker.loadTodos();
            console.log('📋 Current TODOs:');
            todos.forEach(todo => {
                console.log(`  ${todo.id}: ${todo.content} (${todo.priority}, ${todo.status})`);
            });
            break;
        case 'progress':
            const progress = worker.loadProgress();
            if (progress) {
                console.log('📊 Current Progress:');
                console.log(JSON.stringify(progress, null, 2));
            } else {
                console.log('❌ No progress data found');
            }
            break;
        case 'cleanup':
            worker.cleanup();
            break;
        case 'monitor':
            console.log('🔍 Starting progress monitoring only...');
            worker.startProgressMonitoring();
            // Keep running until interrupted
            process.on('SIGINT', () => {
                console.log('\n🛑 Stopping monitoring...');
                worker.stopProgressMonitoring();
                process.exit(0);
            });
            break;
        default:
            console.log('Usage: node work-on-todos.js [work|list|progress|cleanup|monitor]');
            console.log('  work    - Work on highest priority TODO with self-monitoring');
            console.log('  list    - List all TODOs');
            console.log('  progress - Show current progress data');
            console.log('  cleanup - Clean up progress and stall files');
            console.log('  monitor - Start progress monitoring only');
    }
}

export default TodoWorker;
