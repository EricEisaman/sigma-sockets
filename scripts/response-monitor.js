#!/usr/bin/env node

import CompletionTrigger from './completion-trigger.js';
import fs from 'fs';
import path from 'path';

/**
 * Response monitor that can detect completion phrases in assistant responses
 * and automatically trigger improvement cycles
 */
class ResponseMonitor {
  constructor() {
    this.completionTrigger = new CompletionTrigger();
    this.responseFile = path.join(process.cwd(), '.last-response.txt');
    this.lastResponseHash = null;
  }

  /**
   * Monitor the last response for completion phrases
   */
  async monitorLastResponse() {
    try {
      if (!fs.existsSync(this.responseFile)) {
        console.log('📝 No response file found');
        return false;
      }

      const response = fs.readFileSync(this.responseFile, 'utf8');
      const responseHash = this.hashString(response);

      // Only check if response has changed
      if (responseHash === this.lastResponseHash) {
        return false;
      }

      this.lastResponseHash = responseHash;
      console.log('🔍 Checking new response for completion phrases...');

      // Check for completion phrases
      if (this.completionTrigger.detectCompletion(response)) {
        console.log('🎯 COMPLETION PHRASE DETECTED IN RESPONSE!');
        console.log('🚀 TRIGGERING AUTOMATIC IMPROVEMENT CYCLE...');
        await this.completionTrigger.triggerImprovementCycle();
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error monitoring response:', error);
      return false;
    }
  }

  /**
   * Save a response to monitor
   */
  saveResponse(response) {
    try {
      fs.writeFileSync(this.responseFile, response);
      console.log('💾 Response saved for monitoring');
    } catch (error) {
      console.error('❌ Error saving response:', error);
    }
  }

  /**
   * Check specific text for completion phrases
   */
  async checkText(text) {
    console.log(`🔍 Checking text for completion phrases...`);
    
    if (this.completionTrigger.detectCompletion(text)) {
      console.log('🎯 COMPLETION PHRASE DETECTED!');
      console.log('🚀 TRIGGERING IMPROVEMENT CYCLE...');
      await this.completionTrigger.triggerImprovementCycle();
      return true;
    }
    
    console.log('ℹ️ No completion phrases detected');
    return false;
  }

  /**
   * Create a simple hash of a string
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Get the last response
   */
  getLastResponse() {
    try {
      if (fs.existsSync(this.responseFile)) {
        return fs.readFileSync(this.responseFile, 'utf8');
      }
    } catch (error) {
      console.error('❌ Error reading last response:', error);
    }
    return null;
  }

  /**
   * Clear the response file
   */
  clearResponse() {
    try {
      if (fs.existsSync(this.responseFile)) {
        fs.unlinkSync(this.responseFile);
        console.log('🗑️ Response file cleared');
      }
    } catch (error) {
      console.error('❌ Error clearing response file:', error);
    }
  }
}

// Export for use in other scripts
export default ResponseMonitor;

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('response-monitor.js');

if (isMainModule) {
  const monitor = new ResponseMonitor();
  
  const command = process.argv[2];
  const text = process.argv.slice(3).join(' ');
  
  switch (command) {
    case 'monitor':
      monitor.monitorLastResponse();
      break;
    case 'check':
      if (text) {
        monitor.checkText(text);
      } else {
        console.log('❌ Please provide text to check');
      }
      break;
    case 'save':
      if (text) {
        monitor.saveResponse(text);
      } else {
        console.log('❌ Please provide response text to save');
      }
      break;
    case 'get':
      const response = monitor.getLastResponse();
      if (response) {
        console.log('📄 Last response:');
        console.log(response);
      } else {
        console.log('📝 No response found');
      }
      break;
    case 'clear':
      monitor.clearResponse();
      break;
    default:
      console.log('🎯 RESPONSE MONITOR');
      console.log('Usage:');
      console.log('  monitor - Check last saved response for completion phrases');
      console.log('  check "text" - Check specific text for completion phrases');
      console.log('  save "text" - Save response text for monitoring');
      console.log('  get - Get the last saved response');
      console.log('  clear - Clear the response file');
  }
}
