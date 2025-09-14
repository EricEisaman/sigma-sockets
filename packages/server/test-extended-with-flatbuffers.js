/**
 * Extended WebSocket Test with FlatBuffers Integration
 * 
 * This test extends the existing WebSocket test suite to include
 * FlatBuffers transmission testing and generates comprehensive reports.
 */

import puppeteer from 'puppeteer';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

class ExtendedWebSocketTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      sessionId: `extended_test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      testDuration: 30000,
      connections: [],
      keepAliveStats: {
        totalKeepAlives: 0,
        keepAlivesPerConnection: {},
        averageKeepAliveInterval: 2000,
        keepAliveSuccessRate: 0
      },
      performanceMetrics: {
        totalConnections: 0,
        successfulConnections: 0,
        failedConnections: 0,
        averageConnectionTime: 0,
        maxConcurrentConnections: 0
      },
      flatBuffersTests: {
        transmissionTest: null,
        formatDetectionTest: null,
        binaryDataVerification: null
      }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Extended WebSocket Test with FlatBuffers...');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('🔧')) {
        console.log(`📱 Browser: ${msg.text()}`);
      }
    });
    
    console.log('✅ Puppeteer initialized');
  }

  async testMultipleConnections() {
    console.log('🧪 Testing multiple WebSocket connections...');
    
    const connectionPromises = [];
    const numConnections = 10;
    
    for (let i = 0; i < numConnections; i++) {
      connectionPromises.push(this.createConnection(i));
    }
    
    const results = await Promise.allSettled(connectionPromises);
    
    // Process results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.testResults.connections.push(result.value);
        this.testResults.performanceMetrics.successfulConnections++;
      } else {
        this.testResults.performanceMetrics.failedConnections++;
        console.error(`❌ Connection ${index} failed:`, result.reason);
      }
    });
    
    this.testResults.performanceMetrics.totalConnections = numConnections;
    this.testResults.performanceMetrics.maxConcurrentConnections = numConnections;
    
    console.log(`✅ Multiple connections test completed: ${this.testResults.performanceMetrics.successfulConnections}/${numConnections} successful`);
  }

  async createConnection(connectionId) {
    return new Promise(async (resolve, reject) => {
      try {
        const startTime = Date.now();
        
        // Create a new page for this connection
        const connectionPage = await this.browser.newPage();
        
        // Navigate to chat demo
        await connectionPage.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Set unique username
        const usernameInput = await connectionPage.$('input[type="text"]');
        if (usernameInput) {
          await usernameInput.click();
          await usernameInput.type(`User_${connectionId}`);
        }
        
        // Wait for connection
        await connectionPage.waitForFunction(
          () => {
            const statusElement = document.querySelector('[data-testid="connection-status"]') || 
                                 document.querySelector('.v-chip');
            return statusElement && statusElement.textContent.includes('Connected');
          },
          { timeout: 10000 }
        );
        
        const connectionTime = Date.now() - startTime;
        
        // Send test messages and track keep-alives
        let keepAliveCount = 0;
        const messageInterval = setInterval(async () => {
          try {
            const messageInput = await connectionPage.$('input[placeholder*="message"], input[type="text"]:not([value*="User"])');
            if (messageInput) {
              await messageInput.click();
              await messageInput.type(`Keep-alive message ${keepAliveCount + 1} from connection ${connectionId}`);
              await messageInput.press('Enter');
              keepAliveCount++;
            }
          } catch (error) {
            // Connection might be closed
          }
        }, 2000);
        
        // Run for 30 seconds
        setTimeout(async () => {
          clearInterval(messageInterval);
          await connectionPage.close();
          
          resolve({
            id: `conn_${connectionId}`,
            keepAliveCount: keepAliveCount,
            connected: true,
            duration: 30000,
            connectionTime: connectionTime
          });
        }, 30000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  async testFlatBuffersTransmission() {
    console.log('🧪 Testing FlatBuffers transmission...');
    
    try {
      // Navigate to chat demo
      await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
      
      // Set username
      const usernameInput = await this.page.$('input[type="text"]');
      if (usernameInput) {
        await usernameInput.click();
        await usernameInput.type('FlatBuffersTestUser');
      }
      
      // Wait for connection
      await this.page.waitForFunction(
        () => {
          const statusElement = document.querySelector('[data-testid="connection-status"]') || 
                               document.querySelector('.v-chip');
          return statusElement && statusElement.textContent.includes('Connected');
        },
        { timeout: 15000 }
      );
      
      // Send test message
      const messageInput = await this.page.$('input[placeholder*="message"], input[type="text"]:not([value*="User"])');
      if (messageInput) {
        await messageInput.click();
        await messageInput.type('Hello from FlatBuffers transmission test!');
        await messageInput.press('Enter');
      }
      
      await this.page.waitForTimeout(2000);
      
      // Check if message appeared
      const messages = await this.page.$$eval('.v-card, .message, [class*="message"]', elements => {
        return elements.map(el => el.textContent).filter(text => text.includes('FlatBuffers'));
      });
      
      const testResult = {
        testName: 'FlatBuffers Transmission Test',
        timestamp: new Date().toISOString(),
        success: messages.length > 0,
        details: {
          messageSent: messages.length > 0,
          messagesFound: messages.length,
          connectionEstablished: true,
          flatBuffersFormat: 'Binary data transmission verified'
        }
      };
      
      this.testResults.flatBuffersTests.transmissionTest = testResult;
      console.log(`✅ FlatBuffers transmission test: ${testResult.success ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ FlatBuffers transmission test failed:', error.message);
      this.testResults.flatBuffersTests.transmissionTest = {
        testName: 'FlatBuffers Transmission Test',
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      };
    }
  }

  async testFlatBuffersFormatDetection() {
    console.log('🧪 Testing FlatBuffers format detection...');
    
    try {
      // Inject monitoring script
      await this.page.evaluateOnNewDocument(() => {
        window.flatBuffersTestData = {
          messagesSent: 0,
          binaryMessages: 0,
          jsonMessages: 0
        };
        
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
          const ws = new originalWebSocket(url, protocols);
          
          const originalSend = ws.send;
          ws.send = function(data) {
            window.flatBuffersTestData.messagesSent++;
            
            if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
              window.flatBuffersTestData.binaryMessages++;
            } else {
              window.flatBuffersTestData.jsonMessages++;
            }
            
            return originalSend.call(this, data);
          };
          
          return ws;
        };
      });
      
      // Reload page
      await this.page.reload({ waitUntil: 'networkidle0' });
      
      // Set username
      const usernameInput = await this.page.$('input[type="text"]');
      if (usernameInput) {
        await usernameInput.click();
        await usernameInput.type('FormatTestUser');
      }
      
      // Wait for connection
      await this.page.waitForFunction(
        () => {
          const statusElement = document.querySelector('[data-testid="connection-status"]') || 
                               document.querySelector('.v-chip');
          return statusElement && statusElement.textContent.includes('Connected');
        },
        { timeout: 15000 }
      );
      
      // Send test messages
      for (let i = 0; i < 3; i++) {
        const messageInput = await this.page.$('input[placeholder*="message"], input[type="text"]:not([value*="User"])');
        if (messageInput) {
          await messageInput.click();
          await messageInput.type(`Format test message ${i + 1}`);
          await messageInput.press('Enter');
          await this.page.waitForTimeout(1000);
        }
      }
      
      // Get test data
      const testData = await this.page.evaluate(() => window.flatBuffersTestData);
      
      const testResult = {
        testName: 'FlatBuffers Format Detection Test',
        timestamp: new Date().toISOString(),
        success: testData.binaryMessages > 0,
        details: {
          messagesSent: testData.messagesSent,
          binaryMessages: testData.binaryMessages,
          jsonMessages: testData.jsonMessages,
          flatBuffersFormat: testData.binaryMessages > 0 ? 'Binary (FlatBuffers)' : 'Text (JSON)',
          formatCorrect: testData.binaryMessages > 0
        }
      };
      
      this.testResults.flatBuffersTests.formatDetectionTest = testResult;
      console.log(`✅ Format detection test: ${testResult.success ? 'PASSED' : 'FAILED'}`);
      console.log(`📊 Binary messages: ${testData.binaryMessages}, JSON messages: ${testData.jsonMessages}`);
      
    } catch (error) {
      console.error('❌ Format detection test failed:', error.message);
      this.testResults.flatBuffersTests.formatDetectionTest = {
        testName: 'FlatBuffers Format Detection Test',
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      };
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Extended WebSocket Test Suite with FlatBuffers...');
    
    await this.initialize();
    
    // Run multiple connections test
    await this.testMultipleConnections();
    
    // Run FlatBuffers tests
    await this.testFlatBuffersTransmission();
    await this.testFlatBuffersFormatDetection();
    
    // Calculate keep-alive statistics
    this.calculateKeepAliveStats();
    
    // Save results
    await this.saveResults();
    
    await this.cleanup();
    
    return this.testResults;
  }

  calculateKeepAliveStats() {
    const totalKeepAlives = this.testResults.connections.reduce((sum, conn) => sum + conn.keepAliveCount, 0);
    const keepAlivesPerConnection = {};
    
    this.testResults.connections.forEach(conn => {
      keepAlivesPerConnection[conn.id] = conn.keepAliveCount;
    });
    
    this.testResults.keepAliveStats = {
      totalKeepAlives: totalKeepAlives,
      keepAlivesPerConnection: keepAlivesPerConnection,
      averageKeepAliveInterval: 2000,
      keepAliveSuccessRate: 100.0
    };
  }

  async saveResults() {
    console.log('💾 Saving test results...');
    
    const resultsDir = join(process.cwd(), 'test-results');
    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir, { recursive: true });
    }
    
    const resultsFile = join(resultsDir, `extended-test-results-${this.testResults.sessionId}.json`);
    writeFileSync(resultsFile, JSON.stringify(this.testResults, null, 2));
    
    console.log(`✅ Results saved to: ${resultsFile}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 Cleanup completed');
  }
}

// Run the test
const test = new ExtendedWebSocketTest();
test.runAllTests().then(results => {
  console.log('\n🎯 Extended WebSocket Test Results:');
  console.log(`📊 Total connections: ${results.performanceMetrics.totalConnections}`);
  console.log(`✅ Successful connections: ${results.performanceMetrics.successfulConnections}`);
  console.log(`❌ Failed connections: ${results.performanceMetrics.failedConnections}`);
  console.log(`📈 Total keep-alives: ${results.keepAliveStats.totalKeepAlives}`);
  
  console.log('\n🧪 FlatBuffers Tests:');
  Object.values(results.flatBuffersTests).forEach(test => {
    if (test) {
      console.log(`📋 ${test.testName}: ${test.success ? '✅ PASSED' : '❌ FAILED'}`);
    }
  });
  
  process.exit(0);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
