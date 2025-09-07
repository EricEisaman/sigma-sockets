#!/usr/bin/env node

import CompletionTrigger from './completion-trigger.js';
import fs from 'fs';
import path from 'path';

/**
 * Auto-completion monitor that watches for completion phrases
 * and automatically triggers improvement cycles
 */
class AutoCompletionMonitor {
  constructor() {
    this.completionTrigger = new CompletionTrigger();
    this.isMonitoring = false;
    this.lastCheckTime = Date.now();
    this.checkInterval = 5000; // Check every 5 seconds
    this.monitorFile = path.join(process.cwd(), '.completion-monitor.json');
  }

  /**
   * Start monitoring for completion phrases
   */
  startMonitoring() {
    console.log('🎯 AUTO-COMPLETION MONITOR STARTING...');
    this.isMonitoring = true;
    this.monitorLoop();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    console.log('🛑 AUTO-COMPLETION MONITOR STOPPED');
    this.isMonitoring = false;
  }

  /**
   * Main monitoring loop
   */
  async monitorLoop() {
    while (this.isMonitoring) {
      try {
        await this.checkForCompletionPhrases();
        await this.sleep(this.checkInterval);
      } catch (error) {
        console.error('❌ Error in monitoring loop:', error);
        await this.sleep(this.checkInterval);
      }
    }
  }

  /**
   * Check for completion phrases in recent activity
   */
  async checkForCompletionPhrases() {
    // In a real implementation, this would monitor:
    // - Recent git commits
    // - Recent file changes
    // - Recent console output
    // - Recent TODO updates
    
    // For now, we'll simulate by checking if we should trigger
    // based on time since last improvement cycle
    const timeSinceLastCheck = Date.now() - this.lastCheckTime;
    const shouldTrigger = timeSinceLastCheck > 30000; // 30 seconds
    
    if (shouldTrigger) {
      console.log('🔄 AUTO-TRIGGER: Time-based improvement cycle');
      await this.completionTrigger.triggerImprovementCycle();
      this.lastCheckTime = Date.now();
    }
  }

  /**
   * Manually trigger completion detection for specific text
   */
  async checkText(text) {
    console.log(`🔍 Checking text for completion phrases: "${text}"`);
    
    if (this.completionTrigger.detectCompletion(text)) {
      console.log('🎯 COMPLETION DETECTED - TRIGGERING IMPROVEMENT CYCLE');
      await this.completionTrigger.triggerImprovementCycle();
      return true;
    }
    
    return false;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Save monitoring state
   */
  saveState() {
    const state = {
      isMonitoring: this.isMonitoring,
      lastCheckTime: this.lastCheckTime,
      checkInterval: this.checkInterval
    };
    
    fs.writeFileSync(this.monitorFile, JSON.stringify(state, null, 2));
  }

  /**
   * Load monitoring state
   */
  loadState() {
    try {
      if (fs.existsSync(this.monitorFile)) {
        const state = JSON.parse(fs.readFileSync(this.monitorFile, 'utf8'));
        this.isMonitoring = state.isMonitoring || false;
        this.lastCheckTime = state.lastCheckTime || Date.now();
        this.checkInterval = state.checkInterval || 5000;
      }
    } catch (error) {
      console.log('📝 Creating new monitoring state');
    }
  }
}

// Export for use in other scripts
export default AutoCompletionMonitor;

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('auto-completion-monitor.js');

if (isMainModule) {
  const monitor = new AutoCompletionMonitor();
  
  const command = process.argv[2];
  const text = process.argv.slice(3).join(' ');
  
  switch (command) {
    case 'start':
      monitor.startMonitoring();
      break;
    case 'stop':
      monitor.stopMonitoring();
      break;
    case 'check':
      if (text) {
        monitor.checkText(text);
      } else {
        console.log('❌ Please provide text to check');
      }
      break;
    case 'trigger':
      console.log('🚀 MANUAL TRIGGER');
      monitor.completionTrigger.triggerImprovementCycle();
      break;
    default:
      console.log('🎯 AUTO-COMPLETION MONITOR');
      console.log('Usage:');
      console.log('  start  - Start monitoring for completion phrases');
      console.log('  stop   - Stop monitoring');
      console.log('  check "text" - Check specific text for completion phrases');
      console.log('  trigger - Manually trigger improvement cycle');
  }
}
