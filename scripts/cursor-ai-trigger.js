#!/usr/bin/env node

/**
 * Cursor AI Trigger System
 * This script actually triggers the AI assistant in Cursor to work on TODOs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

class CursorAITrigger {
    constructor() {
        this.projectDir = process.cwd();
        this.todoFile = path.join(this.projectDir, '.todos.json');
        this.triggerFile = path.join(this.projectDir, '.ai-trigger.json');
        this.cursorCommandsFile = path.join(this.projectDir, '.cursor-commands.txt');
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

    // Create AI trigger command
    createAITrigger(todo) {
        const trigger = {
            timestamp: new Date().toISOString(),
            action: 'work_on_todo',
            todo: todo,
            command: `Please work on this TODO: "${todo.content}" (Priority: ${todo.priority}, Status: ${todo.status})`,
            context: {
                project: 'SigmaSockets',
                location: this.projectDir,
                urgency: todo.priority === 'critical' ? 'URGENT' : 'NORMAL'
            }
        };

        // Save trigger to file
        writeFileSync(this.triggerFile, JSON.stringify(trigger, null, 2));
        
        // Create a simple text command for Cursor
        const command = `AI TRIGGER: ${trigger.command}\n\nContext: ${JSON.stringify(trigger.context, null, 2)}`;
        writeFileSync(this.cursorCommandsFile, command);

        return trigger;
    }

    // Send notification to Cursor (if possible)
    notifyCursor(trigger) {
        try {
            // Try to send a system notification
            if (process.platform === 'darwin') {
                execSync(`osascript -e 'display notification "${trigger.command}" with title "AI Trigger - SigmaSockets"'`);
            }
            
            console.log('🔔 Notification sent to system');
        } catch (error) {
            console.log('⚠️  Could not send system notification');
        }
    }

    // Create a file that Cursor can watch
    createCursorWatchFile(trigger) {
        const watchFile = path.join(this.projectDir, '.cursor-ai-trigger.txt');
        const content = `AI TRIGGER - ${new Date().toISOString()}
${trigger.command}

TODO Details:
- ID: ${trigger.todo.id}
- Priority: ${trigger.todo.priority}
- Status: ${trigger.todo.status}
- Note: ${trigger.todo.note || 'None'}

Please work on this TODO immediately!
`;
        
        writeFileSync(watchFile, content);
        console.log(`📝 Created Cursor watch file: ${watchFile}`);
    }

    // Main trigger function
    triggerAI() {
        console.log('🤖 CURSOR AI TRIGGER SYSTEM');
        console.log('============================');
        
        const todo = this.getHighestPriorityTodo();
        if (!todo) {
            console.log('❌ No TODOs found to work on');
            return false;
        }

        console.log(`🎯 Found highest priority TODO: ${todo.content}`);
        console.log(`   Priority: ${todo.priority} | Status: ${todo.status}`);
        
        const trigger = this.createAITrigger(todo);
        console.log('✅ AI trigger created');
        
        this.notifyCursor(trigger);
        this.createCursorWatchFile(trigger);
        
        console.log('🚀 AI assistant should now be triggered to work on the TODO');
        console.log(`📁 Check: ${this.cursorCommandsFile}`);
        console.log(`📁 Watch: ${path.join(this.projectDir, '.cursor-ai-trigger.txt')}`);
        
        return true;
    }

    // Check if AI is responding
    checkAIResponse() {
        const triggerFile = path.join(this.projectDir, '.ai-response.json');
        if (existsSync(triggerFile)) {
            try {
                const response = JSON.parse(readFileSync(triggerFile, 'utf8'));
                console.log('✅ AI response detected:', response.message);
                return true;
            } catch (error) {
                console.log('❌ Error reading AI response');
            }
        }
        return false;
    }

    // Clear old triggers
    clearOldTriggers() {
        const files = [
            this.triggerFile,
            this.cursorCommandsFile,
            path.join(this.projectDir, '.cursor-ai-trigger.txt')
        ];
        
        files.forEach(file => {
            if (existsSync(file)) {
                try {
                    require('fs').unlinkSync(file);
                    console.log(`🗑️  Cleared old trigger: ${file}`);
                } catch (error) {
                    console.log(`⚠️  Could not clear: ${file}`);
                }
            }
        });
    }
}

// CLI interface
if (process.argv[1] && process.argv[1].endsWith('cursor-ai-trigger.js')) {
    const trigger = new CursorAITrigger();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'trigger':
            trigger.triggerAI();
            break;
        case 'check':
            trigger.checkAIResponse();
            break;
        case 'clear':
            trigger.clearOldTriggers();
            break;
        default:
            console.log('Usage: node cursor-ai-trigger.js [trigger|check|clear]');
            console.log('  trigger - Trigger AI to work on highest priority TODO');
            console.log('  check   - Check if AI has responded');
            console.log('  clear   - Clear old trigger files');
    }
}

export default CursorAITrigger;
