#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';

/**
 * Auto-completion trigger that automatically runs when completion phrases are detected
 */
class AutoCompletionTrigger {
  constructor() {
    this.completionPhrases = [
      'The SigmaSockets project now has',
      'What Was Accomplished', 
      'The system is now ready',
      'Project is complete',
      'Implementation is finished',
      'system is now ready',
      'project is now complete',
      'implementation is finished',
      'all tasks completed',
      'ready for production',
      'system is fully operational',
      'excellence achieved',
      'perfection achieved',
      'continuous evolution',
      'automatically improve',
      'now ready to automatically',
      'ensuring continuous evolution',
      'toward perfection',
      'completion detection system is now ready',
      'fully operational',
      'ready to automatically improve',
      'The completion detection system is now ready'
    ];
  }

  /**
   * Check if text contains completion phrases
   */
  detectCompletion(text) {
    const lowerText = text.toLowerCase();
    
    for (const phrase of this.completionPhrases) {
      if (lowerText.includes(phrase.toLowerCase())) {
        console.log(`🎯 COMPLETION DETECTED: "${phrase}"`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Automatically trigger improvement cycle
   */
  async autoTrigger() {
    console.log('🚀 AUTO-TRIGGERING IMPROVEMENT CYCLE...');
    
    try {
      // Run the radical completion monitor trigger
      const process = spawn('node', ['scripts/radical-completion-monitor.js', 'trigger'], {
        stdio: 'inherit',
        shell: true
      });

      return new Promise((resolve, reject) => {
        process.on('close', (code) => {
          if (code === 0) {
            console.log('✅ AUTO-TRIGGER COMPLETED');
            resolve();
          } else {
            console.log(`❌ AUTO-TRIGGER FAILED with code ${code}`);
            reject(new Error(`Process exited with code ${code}`));
          }
        });
      });
    } catch (error) {
      console.error('❌ Error in auto-trigger:', error);
    }
  }

  /**
   * Process text and auto-trigger if completion detected
   */
  async processText(text) {
    if (this.detectCompletion(text)) {
      console.log('🎯 COMPLETION PHRASE DETECTED - AUTO-TRIGGERING!');
      await this.autoTrigger();
      return true;
    }
    
    return false;
  }
}

// Export for use in other scripts
export default AutoCompletionTrigger;

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('auto-completion-trigger.js');

if (isMainModule) {
  const trigger = new AutoCompletionTrigger();
  
  const command = process.argv[2];
  const text = process.argv.slice(3).join(' ');
  
  switch (command) {
    case 'check':
      if (text) {
        await trigger.processText(text);
      } else {
        console.log('❌ Please provide text to check');
      }
      break;
    case 'trigger':
      console.log('🚀 MANUAL AUTO-TRIGGER');
      await trigger.autoTrigger();
      break;
    default:
      console.log('🎯 AUTO-COMPLETION TRIGGER');
      console.log('Usage:');
      console.log('  check "text" - Check text and auto-trigger if completion detected');
      console.log('  trigger - Manually trigger improvement cycle');
  }
}
