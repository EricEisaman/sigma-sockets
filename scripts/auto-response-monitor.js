#!/usr/bin/env node

import CompletionTrigger from './completion-trigger.js';
import fs from 'fs';
import path from 'path';

/**
 * Auto-response monitor that automatically detects completion phrases
 * in assistant responses and triggers improvement cycles
 */
class AutoResponseMonitor {
  constructor() {
    this.completionTrigger = new CompletionTrigger();
    this.isActive = true;
    this.responseBuffer = '';
    this.lastTriggerTime = 0;
    this.minTriggerInterval = 10000; // Minimum 10 seconds between triggers
  }

  /**
   * Process a response and check for completion phrases
   */
  async processResponse(response) {
    if (!this.isActive) return;

    try {
      // Add to buffer
      this.responseBuffer += response;
      
      // Check if we have a complete response (ends with punctuation)
      if (this.isCompleteResponse(this.responseBuffer)) {
        await this.checkAndTrigger(this.responseBuffer);
        this.responseBuffer = ''; // Clear buffer
      }
    } catch (error) {
      console.error('❌ Error processing response:', error);
    }
  }

  /**
   * Check if response is complete
   */
  isCompleteResponse(text) {
    const trimmed = text.trim();
    return trimmed.length > 0 && /[.!?]$/.test(trimmed);
  }

  /**
   * Check for completion phrases and trigger if found
   */
  async checkAndTrigger(response) {
    const now = Date.now();
    
    // Rate limiting - don't trigger too frequently
    if (now - this.lastTriggerTime < this.minTriggerInterval) {
      return;
    }

    if (this.completionTrigger.detectCompletion(response)) {
      console.log('🎯 COMPLETION PHRASE DETECTED IN RESPONSE!');
      console.log('🚀 TRIGGERING AUTOMATIC IMPROVEMENT CYCLE...');
      
      this.lastTriggerTime = now;
      await this.completionTrigger.triggerImprovementCycle();
    }
  }

  /**
   * Enable/disable monitoring
   */
  setActive(active) {
    this.isActive = active;
    console.log(`🔄 Auto-response monitor ${active ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      lastTriggerTime: this.lastTriggerTime,
      minTriggerInterval: this.minTriggerInterval,
      bufferLength: this.responseBuffer.length
    };
  }
}

// Create global instance
const autoMonitor = new AutoResponseMonitor();

// Export for use in other scripts
export default autoMonitor;

// Auto-trigger function that can be called from anywhere
export async function autoTriggerCompletion(response) {
  await autoMonitor.processResponse(response);
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('auto-response-monitor.js');

if (isMainModule) {
  const command = process.argv[2];
  const text = process.argv.slice(3).join(' ');
  
  switch (command) {
    case 'enable':
      autoMonitor.setActive(true);
      break;
    case 'disable':
      autoMonitor.setActive(false);
      break;
    case 'status':
      const status = autoMonitor.getStatus();
      console.log('📊 Auto-Response Monitor Status:');
      console.log(`Active: ${status.isActive}`);
      console.log(`Last Trigger: ${new Date(status.lastTriggerTime).toISOString()}`);
      console.log(`Min Interval: ${status.minTriggerInterval}ms`);
      console.log(`Buffer Length: ${status.bufferLength}`);
      break;
    case 'check':
      if (text) {
        await autoMonitor.processResponse(text);
      } else {
        console.log('❌ Please provide text to check');
      }
      break;
    case 'trigger':
      console.log('🚀 MANUAL TRIGGER');
      await autoMonitor.completionTrigger.triggerImprovementCycle();
      break;
    default:
      console.log('🎯 AUTO-RESPONSE MONITOR');
      console.log('Usage:');
      console.log('  enable - Enable automatic response monitoring');
      console.log('  disable - Disable automatic response monitoring');
      console.log('  status - Show monitoring status');
      console.log('  check "text" - Check specific text for completion phrases');
      console.log('  trigger - Manually trigger improvement cycle');
  }
}
