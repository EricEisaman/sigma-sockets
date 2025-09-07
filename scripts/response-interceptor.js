#!/usr/bin/env node

import CompletionTrigger from './completion-trigger.js';
import fs from 'fs';
import path from 'path';

/**
 * Response interceptor that monitors assistant responses for completion phrases
 * and automatically triggers improvement cycles
 */
class ResponseInterceptor {
  constructor() {
    this.completionTrigger = new CompletionTrigger();
    this.responseLogFile = path.join(process.cwd(), '.response-log.json');
    this.isIntercepting = false;
    this.responseCount = 0;
  }

  /**
   * Start intercepting responses
   */
  startIntercepting() {
    console.log('🎯 RESPONSE INTERCEPTOR STARTING...');
    this.isIntercepting = true;
    
    // Set up process monitoring
    this.setupProcessMonitoring();
    
    console.log('✅ Response interceptor is now monitoring for completion phrases');
  }

  /**
   * Stop intercepting responses
   */
  stopIntercepting() {
    console.log('🛑 RESPONSE INTERCEPTOR STOPPED');
    this.isIntercepting = false;
  }

  /**
   * Set up process monitoring to detect completion phrases
   */
  setupProcessMonitoring() {
    // Monitor for completion phrases in the current process
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    const self = this;
    
    console.log = function(...args) {
      const message = args.join(' ');
      self.checkForCompletionPhrases(message);
      originalConsoleLog.apply(console, args);
    };
    
    console.error = function(...args) {
      const message = args.join(' ');
      self.checkForCompletionPhrases(message);
      originalConsoleError.apply(console, args);
    };
    
    // Also monitor process exit
    process.on('exit', () => {
      if (self.isIntercepting) {
        console.log('🔄 Process exiting - checking for final completion phrases');
      }
    });
  }

  /**
   * Check message for completion phrases
   */
  async checkForCompletionPhrases(message) {
    if (!this.isIntercepting) return;
    
    try {
      if (this.completionTrigger.detectCompletion(message)) {
        console.log('🎯 COMPLETION PHRASE DETECTED IN RESPONSE!');
        console.log('🚀 TRIGGERING AUTOMATIC IMPROVEMENT CYCLE...');
        
        // Log the response
        this.logResponse(message, true);
        
        // Trigger improvement cycle
        await this.completionTrigger.triggerImprovementCycle();
        
        // Increment response count
        this.responseCount++;
      } else {
        // Log regular response
        this.logResponse(message, false);
      }
    } catch (error) {
      console.error('❌ Error checking completion phrases:', error);
    }
  }

  /**
   * Log a response
   */
  logResponse(message, hasCompletionPhrase) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        message: message.substring(0, 200), // Truncate for storage
        hasCompletionPhrase,
        responseCount: this.responseCount
      };
      
      let logs = [];
      if (fs.existsSync(this.responseLogFile)) {
        logs = JSON.parse(fs.readFileSync(this.responseLogFile, 'utf8'));
      }
      
      logs.push(logEntry);
      
      // Keep only last 100 entries
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }
      
      fs.writeFileSync(this.responseLogFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('❌ Error logging response:', error);
    }
  }

  /**
   * Get response statistics
   */
  getStats() {
    try {
      if (!fs.existsSync(this.responseLogFile)) {
        return { totalResponses: 0, completionPhrases: 0 };
      }
      
      const logs = JSON.parse(fs.readFileSync(this.responseLogFile, 'utf8'));
      const completionPhrases = logs.filter(log => log.hasCompletionPhrase).length;
      
      return {
        totalResponses: logs.length,
        completionPhrases,
        lastResponse: logs[logs.length - 1]
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return { totalResponses: 0, completionPhrases: 0 };
    }
  }

  /**
   * Clear response log
   */
  clearLog() {
    try {
      if (fs.existsSync(this.responseLogFile)) {
        fs.unlinkSync(this.responseLogFile);
        console.log('🗑️ Response log cleared');
      }
    } catch (error) {
      console.error('❌ Error clearing log:', error);
    }
  }

  /**
   * Manually check text for completion phrases
   */
  async checkText(text) {
    console.log(`🔍 Manually checking text for completion phrases...`);
    
    if (this.completionTrigger.detectCompletion(text)) {
      console.log('🎯 COMPLETION PHRASE DETECTED!');
      console.log('🚀 TRIGGERING IMPROVEMENT CYCLE...');
      await this.completionTrigger.triggerImprovementCycle();
      return true;
    }
    
    console.log('ℹ️ No completion phrases detected');
    return false;
  }
}

// Export for use in other scripts
export default ResponseInterceptor;

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('response-interceptor.js');

if (isMainModule) {
  const interceptor = new ResponseInterceptor();
  
  const command = process.argv[2];
  const text = process.argv.slice(3).join(' ');
  
  switch (command) {
    case 'start':
      interceptor.startIntercepting();
      break;
    case 'stop':
      interceptor.stopIntercepting();
      break;
    case 'check':
      if (text) {
        interceptor.checkText(text);
      } else {
        console.log('❌ Please provide text to check');
      }
      break;
    case 'stats':
      const stats = interceptor.getStats();
      console.log('📊 Response Statistics:');
      console.log(`Total Responses: ${stats.totalResponses}`);
      console.log(`Completion Phrases: ${stats.completionPhrases}`);
      if (stats.lastResponse) {
        console.log(`Last Response: ${stats.lastResponse.timestamp}`);
      }
      break;
    case 'clear':
      interceptor.clearLog();
      break;
    default:
      console.log('🎯 RESPONSE INTERCEPTOR');
      console.log('Usage:');
      console.log('  start - Start intercepting responses for completion phrases');
      console.log('  stop - Stop intercepting responses');
      console.log('  check "text" - Check specific text for completion phrases');
      console.log('  stats - Show response statistics');
      console.log('  clear - Clear response log');
  }
}
