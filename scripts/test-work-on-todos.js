#!/usr/bin/env node

/**
 * Test Work on TODOs Script
 * This script tests the work-on-todos functionality with a timeout
 */

import { spawn } from 'child_process';
import path from 'path';

class WorkOnTodosTester {
    constructor() {
        this.projectDir = process.cwd();
        this.testTimeout = 120000; // 2 minutes
    }

    // Test the work-on-todos script
    testWorkOnTodos() {
        console.log('🧪 TESTING WORK-ON-TODOS SCRIPT');
        console.log('================================');
        console.log(`⏰ Test timeout: ${this.testTimeout / 1000} seconds`);
        
        return new Promise((resolve, reject) => {
            const child = spawn('node', ['scripts/work-on-todos.js', 'work'], {
                cwd: this.projectDir,
                stdio: 'inherit'
            });

            let completed = false;
            let output = '';

            // Set up timeout
            const timeout = setTimeout(() => {
                if (!completed) {
                    console.log('\n⏰ TEST TIMEOUT - Terminating process...');
                    child.kill('SIGTERM');
                    completed = true;
                    reject(new Error('Test timed out after 2 minutes'));
                }
            }, this.testTimeout);

            // Handle process completion
            child.on('close', (code) => {
                if (!completed) {
                    clearTimeout(timeout);
                    completed = true;
                    console.log(`\n✅ Process completed with exit code: ${code}`);
                    resolve(code);
                }
            });

            // Handle process errors
            child.on('error', (error) => {
                if (!completed) {
                    clearTimeout(timeout);
                    completed = true;
                    console.log(`\n❌ Process error: ${error.message}`);
                    reject(error);
                }
            });

            // Handle process termination
            child.on('SIGTERM', () => {
                if (!completed) {
                    clearTimeout(timeout);
                    completed = true;
                    console.log('\n🛑 Process terminated by timeout');
                    reject(new Error('Process terminated by timeout'));
                }
            });
        });
    }

    // Run the test
    async runTest() {
        try {
            console.log('🚀 Starting work-on-todos test...');
            const exitCode = await this.testWorkOnTodos();
            
            if (exitCode === 0) {
                console.log('✅ Test completed successfully');
            } else {
                console.log(`⚠️  Test completed with exit code: ${exitCode}`);
            }
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            process.exit(1);
        }
    }
}

// CLI interface
if (process.argv[1] && process.argv[1].endsWith('test-work-on-todos.js')) {
    const tester = new WorkOnTodosTester();
    tester.runTest();
}

export default WorkOnTodosTester;
