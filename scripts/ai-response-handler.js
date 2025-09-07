#!/usr/bin/env node

/**
 * AI Response Handler
 * This script handles AI responses to triggers and updates the system
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

class AIResponseHandler {
    constructor() {
        this.projectDir = process.cwd();
        this.triggerFile = path.join(this.projectDir, '.ai-trigger.json');
        this.responseFile = path.join(this.projectDir, '.ai-response.json');
        this.cursorCommandsFile = path.join(this.projectDir, '.cursor-commands.txt');
    }

    // Check for AI triggers
    checkForTriggers() {
        if (!existsSync(this.triggerFile)) {
            return null;
        }

        try {
            const trigger = JSON.parse(readFileSync(this.triggerFile, 'utf8'));
            console.log('🎯 AI Trigger detected:', trigger.command);
            return trigger;
        } catch (error) {
            console.error('Error reading trigger:', error.message);
            return null;
        }
    }

    // Create AI response
    createResponse(trigger, message, action = 'acknowledged') {
        const response = {
            timestamp: new Date().toISOString(),
            triggerId: trigger.todo.id,
            action: action,
            message: message,
            status: 'completed'
        };

        writeFileSync(this.responseFile, JSON.stringify(response, null, 2));
        console.log('✅ AI response created:', message);
    }

    // Handle TODO completion
    handleTodoCompletion(todoId) {
        try {
            // Update TODO status to completed
            execSync(`node scripts/todo-manager.js complete "${todoId}"`, { stdio: 'inherit' });
            console.log(`✅ TODO ${todoId} marked as completed`);
        } catch (error) {
            console.error('Error completing TODO:', error.message);
        }
    }

    // Handle TODO update
    handleTodoUpdate(todoId, newContent) {
        try {
            // Update TODO content
            execSync(`node scripts/todo-manager.js update "${todoId}" "${newContent}"`, { stdio: 'inherit' });
            console.log(`✅ TODO ${todoId} updated`);
        } catch (error) {
            console.error('Error updating TODO:', error.message);
        }
    }

    // Main response handler
    handleResponse() {
        console.log('🤖 AI RESPONSE HANDLER');
        console.log('======================');
        
        const trigger = this.checkForTriggers();
        if (!trigger) {
            console.log('❌ No AI triggers found');
            return false;
        }

        console.log(`📋 Working on TODO: ${trigger.todo.content}`);
        console.log(`🎯 Priority: ${trigger.todo.priority}`);
        
        // Create acknowledgment response
        this.createResponse(trigger, `Working on TODO: ${trigger.todo.content}`, 'working');
        
        // Clear the trigger file
        if (existsSync(this.triggerFile)) {
            require('fs').unlinkSync(this.triggerFile);
        }
        
        console.log('🚀 AI is now working on the TODO');
        return true;
    }
}

// CLI interface
if (process.argv[1] && process.argv[1].endsWith('ai-response-handler.js')) {
    const handler = new AIResponseHandler();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'handle':
            handler.handleResponse();
            break;
        case 'check':
            const trigger = handler.checkForTriggers();
            if (trigger) {
                console.log('Trigger found:', trigger.command);
            } else {
                console.log('No triggers found');
            }
            break;
        default:
            console.log('Usage: node ai-response-handler.js [handle|check]');
            console.log('  handle - Handle AI triggers and create responses');
            console.log('  check  - Check for pending AI triggers');
    }
}

export default AIResponseHandler;
