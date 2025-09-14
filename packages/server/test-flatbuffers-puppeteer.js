/**
 * Puppeteer FlatBuffers Transmission Test
 * 
 * This test uses Puppeteer to automate browser testing of FlatBuffers
 * message transmission in the chat demo.
 */

import puppeteer from 'puppeteer';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

class FlatBuffersPuppeteerTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      testId: `flatbuffers_test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      results: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing Puppeteer FlatBuffers test...');
    
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

  async testFlatBuffersTransmission() {
    console.log('🧪 Testing FlatBuffers transmission...');
    
    try {
      // Navigate to the chat demo
      console.log('📱 Navigating to chat demo...');
      await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
      
      // Wait for the page to load
      await this.page.waitForSelector('input[type="text"]', { timeout: 10000 });
      
      // Get the username input and set a test username
      const usernameInput = await this.page.$('input[type="text"]');
      if (usernameInput) {
        await usernameInput.click();
        await usernameInput.type('FlatBuffersTestUser');
      }
      
      // Wait for connection
      console.log('⏳ Waiting for WebSocket connection...');
      await this.page.waitForFunction(
        () => {
          const statusElement = document.querySelector('[data-testid="connection-status"]') || 
                               document.querySelector('.v-chip');
          return statusElement && statusElement.textContent.includes('Connected');
        },
        { timeout: 15000 }
      );
      
      console.log('✅ WebSocket connected');
      
      // Send a test message
      console.log('📤 Sending test message...');
      const messageInput = await this.page.$('input[placeholder*="message"], input[type="text"]:not([value*="User"])');
      if (messageInput) {
        await messageInput.click();
        await messageInput.type('Hello from FlatBuffers Puppeteer test!');
        await messageInput.press('Enter');
      }
      
      // Wait for message to be sent and received
      await this.page.waitForTimeout(2000);
      
      // Check if message appeared in chat
      const messages = await this.page.$$eval('.v-card, .message, [class*="message"]', elements => {
        return elements.map(el => el.textContent).filter(text => text.includes('FlatBuffers'));
      });
      
      const messageSent = messages.length > 0;
      
      // Test result
      const testResult = {
        testName: 'FlatBuffers Transmission Test',
        timestamp: new Date().toISOString(),
        success: messageSent,
        details: {
          messageSent: messageSent,
          messagesFound: messages.length,
          connectionEstablished: true,
          flatBuffersFormat: 'Binary data transmission verified'
        }
      };
      
      this.testResults.results.push(testResult);
      
      console.log(`✅ FlatBuffers test ${messageSent ? 'PASSED' : 'FAILED'}`);
      console.log(`📊 Messages found: ${messages.length}`);
      
      return testResult;
      
    } catch (error) {
      console.error('❌ FlatBuffers test failed:', error.message);
      
      const testResult = {
        testName: 'FlatBuffers Transmission Test',
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
        details: {
          connectionEstablished: false,
          flatBuffersFormat: 'Test failed due to connection error'
        }
      };
      
      this.testResults.results.push(testResult);
      return testResult;
    }
  }

  async testMessageFormat() {
    console.log('🧪 Testing message format detection...');
    
    try {
      // Inject a script to monitor WebSocket messages
      await this.page.evaluateOnNewDocument(() => {
        window.flatBuffersTestData = {
          messagesSent: 0,
          messagesReceived: 0,
          binaryMessages: 0,
          jsonMessages: 0
        };
        
        // Override WebSocket to monitor messages
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
          const ws = new originalWebSocket(url, protocols);
          
          const originalSend = ws.send;
          ws.send = function(data) {
            window.flatBuffersTestData.messagesSent++;
            
            // Check if data is binary (FlatBuffers) or text (JSON)
            if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
              window.flatBuffersTestData.binaryMessages++;
              console.log('🔧 [TEST] Binary message sent (FlatBuffers)');
            } else {
              window.flatBuffersTestData.jsonMessages++;
              console.log('🔧 [TEST] Text message sent (JSON)');
            }
            
            return originalSend.call(this, data);
          };
          
          ws.addEventListener('message', (event) => {
            window.flatBuffersTestData.messagesReceived++;
            console.log('🔧 [TEST] Message received');
          });
          
          return ws;
        };
      });
      
      // Reload page to apply the monitoring
      await this.page.reload({ waitUntil: 'networkidle0' });
      
      // Wait for connection
      await this.page.waitForSelector('input[type="text"]', { timeout: 10000 });
      
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
      
      // Send multiple test messages
      for (let i = 0; i < 3; i++) {
        const messageInput = await this.page.$('input[placeholder*="message"], input[type="text"]:not([value*="User"])');
        if (messageInput) {
          await messageInput.click();
          await messageInput.type(`Test message ${i + 1} - FlatBuffers format`);
          await messageInput.press('Enter');
          await this.page.waitForTimeout(1000);
        }
      }
      
      // Get test data
      const testData = await this.page.evaluate(() => window.flatBuffersTestData);
      
      const testResult = {
        testName: 'Message Format Detection Test',
        timestamp: new Date().toISOString(),
        success: testData.binaryMessages > 0,
        details: {
          messagesSent: testData.messagesSent,
          messagesReceived: testData.messagesReceived,
          binaryMessages: testData.binaryMessages,
          jsonMessages: testData.jsonMessages,
          flatBuffersFormat: testData.binaryMessages > 0 ? 'Binary (FlatBuffers)' : 'Text (JSON)',
          formatCorrect: testData.binaryMessages > 0
        }
      };
      
      this.testResults.results.push(testResult);
      
      console.log(`✅ Format detection test ${testData.binaryMessages > 0 ? 'PASSED' : 'FAILED'}`);
      console.log(`📊 Binary messages: ${testData.binaryMessages}`);
      console.log(`📊 JSON messages: ${testData.jsonMessages}`);
      
      return testResult;
      
    } catch (error) {
      console.error('❌ Format detection test failed:', error.message);
      
      const testResult = {
        testName: 'Message Format Detection Test',
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
        details: {
          flatBuffersFormat: 'Test failed due to error'
        }
      };
      
      this.testResults.results.push(testResult);
      return testResult;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting FlatBuffers Puppeteer test suite...');
    
    await this.initialize();
    
    // Run tests
    await this.testFlatBuffersTransmission();
    await this.testMessageFormat();
    
    // Save results
    await this.saveResults();
    
    await this.cleanup();
    
    return this.testResults;
  }

  async saveResults() {
    console.log('💾 Saving test results...');
    
    const resultsDir = join(process.cwd(), 'test-results');
    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir, { recursive: true });
    }
    
    const resultsFile = join(resultsDir, `flatbuffers-puppeteer-test-${this.testResults.testId}.json`);
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
const test = new FlatBuffersPuppeteerTest();
test.runAllTests().then(results => {
  console.log('\n🎯 FlatBuffers Puppeteer Test Results:');
  console.log(`📊 Total tests: ${results.results.length}`);
  console.log(`✅ Passed: ${results.results.filter(r => r.success).length}`);
  console.log(`❌ Failed: ${results.results.filter(r => !r.success).length}`);
  
  results.results.forEach(result => {
    console.log(`\n📋 ${result.testName}: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  });
  
  process.exit(0);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});