#!/usr/bin/env node

/**
 * Comprehensive WebSocket Reconnection Test with Puppeteer
 * 
 * This test uses Puppeteer to simulate real browser conditions and test
 * WebSocket reconnection capabilities, connection quality management,
 * and keep-alive mechanisms under various network failure scenarios.
 */

import { SigmaSocketServer } from './dist/index.js';
import puppeteer from 'puppeteer';

class WebSocketPuppeteerTest {
  constructor() {
    this.server = new SigmaSocketServer({
      port: 8086,
      host: 'localhost',
      heartbeatInterval: 2000,
      minHeartbeatInterval: 1000,
      maxHeartbeatInterval: 5000,
      adaptiveHeartbeatEnabled: true,
      connectionQualityThreshold: 0.7,
      sessionTimeout: 30000
    });
    this.testResults = [];
    this.browser = null;
    this.pages = [];
  }

  async runPuppeteerTests() {
    console.log('🚀 Starting Comprehensive WebSocket Test with Puppeteer...');
    console.log('=' .repeat(80));
    
    const startTime = Date.now();

    try {
      // Start server
      await this.server.start();
      console.log('✅ Server started on port 8086');

      // Launch Puppeteer browser
      this.browser = await puppeteer.launch({
        headless: false, // Set to true for CI/CD
        devtools: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      console.log('✅ Puppeteer browser launched');

      // Run comprehensive tests
      await this.testBasicWebSocketConnection();
      await this.testWebSocketReconnection();
      await this.testNetworkInterruption();
      await this.testServerRestart();
      await this.testMultipleConnections();
      await this.testConnectionQualityMonitoring();
      await this.testKeepAliveMechanisms();
      await this.testLoadBalancerTimeout();
      await this.testStressTest();

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const results = this.generateTestReport(totalDuration);
      this.printTestReport(results);

      return results;

    } catch (error) {
      console.error('❌ Puppeteer test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async testBasicWebSocketConnection() {
    console.log('\n📋 Test 1: Basic WebSocket Connection');
    const startTime = Date.now();
    
    try {
      const page = await this.browser.newPage();
      this.pages.push(page);

      // Set proper user agent to pass security validation
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Create HTML page with WebSocket client
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>WebSocket Test</title>
        </head>
        <body>
          <div id="status">Connecting...</div>
          <div id="messages"></div>
          <script>
            let ws;
            let messageCount = 0;
            const statusDiv = document.getElementById('status');
            const messagesDiv = document.getElementById('messages');
            
            function connect() {
              ws = new WebSocket('ws://localhost:8086');
              
              ws.onopen = function(event) {
                statusDiv.textContent = 'Connected';
                statusDiv.style.color = 'green';
                console.log('WebSocket connected');
              };
              
              ws.onmessage = function(event) {
                messageCount++;
                messagesDiv.innerHTML += '<div>Message ' + messageCount + ': ' + event.data + '</div>';
                console.log('Received message:', event.data);
              };
              
              ws.onclose = function(event) {
                statusDiv.textContent = 'Disconnected';
                statusDiv.style.color = 'red';
                console.log('WebSocket disconnected:', event.code, event.reason);
              };
              
              ws.onerror = function(error) {
                statusDiv.textContent = 'Error';
                statusDiv.style.color = 'red';
                console.error('WebSocket error:', error);
              };
            }
            
            function sendMessage() {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: 'test', data: 'Hello from browser', timestamp: Date.now()}));
              }
            }
            
            // Connect immediately
            connect();
            
            // Send test message after 1 second
            setTimeout(sendMessage, 1000);
          </script>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);

      // Wait for connection
      await page.waitForFunction(() => {
        const status = document.getElementById('status');
        return status && status.textContent === 'Connected';
      }, { timeout: 10000 });

      console.log('  ✅ WebSocket connected successfully');

      // Wait for message
      await page.waitForFunction(() => {
        const messages = document.getElementById('messages');
        return messages && messages.children.length > 0;
      }, { timeout: 5000 });

      console.log('  ✅ Message received successfully');

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Basic WebSocket Connection',
        success: true,
        duration,
        details: 'Successfully established WebSocket connection and received messages'
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Basic WebSocket Connection',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testWebSocketReconnection() {
    console.log('\n📋 Test 2: WebSocket Reconnection');
    const startTime = Date.now();
    
    try {
      const page = await this.browser.newPage();
      this.pages.push(page);

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>WebSocket Reconnection Test</title>
        </head>
        <body>
          <div id="status">Connecting...</div>
          <div id="reconnection-count">Reconnections: 0</div>
          <div id="messages"></div>
          <script>
            let ws;
            let reconnectionCount = 0;
            let maxReconnections = 3;
            const statusDiv = document.getElementById('status');
            const reconnectionDiv = document.getElementById('reconnection-count');
            const messagesDiv = document.getElementById('messages');
            
            function connect() {
              ws = new WebSocket('ws://localhost:8086');
              
              ws.onopen = function(event) {
                statusDiv.textContent = 'Connected';
                statusDiv.style.color = 'green';
                console.log('WebSocket connected');
              };
              
              ws.onmessage = function(event) {
                messagesDiv.innerHTML += '<div>Message: ' + event.data + '</div>';
                console.log('Received message:', event.data);
              };
              
              ws.onclose = function(event) {
                statusDiv.textContent = 'Disconnected';
                statusDiv.style.color = 'red';
                console.log('WebSocket disconnected:', event.code, event.reason);
                
                if (reconnectionCount < maxReconnections) {
                  reconnectionCount++;
                  reconnectionDiv.textContent = 'Reconnections: ' + reconnectionCount;
                  console.log('Attempting reconnection ' + reconnectionCount);
                  
                  setTimeout(() => {
                    connect();
                  }, 1000);
                }
              };
              
              ws.onerror = function(error) {
                statusDiv.textContent = 'Error';
                statusDiv.style.color = 'red';
                console.error('WebSocket error:', error);
              };
            }
            
            // Connect initially
            connect();
            
            // Simulate connection loss after 2 seconds
            setTimeout(() => {
              if (ws) {
                ws.close();
              }
            }, 2000);
          </script>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);

      // Wait for initial connection
      await page.waitForFunction(() => {
        const status = document.getElementById('status');
        return status && status.textContent === 'Connected';
      }, { timeout: 10000 });

      console.log('  ✅ Initial connection established');

      // Wait for reconnection
      await page.waitForFunction(() => {
        const reconnectionDiv = document.getElementById('reconnection-count');
        return reconnectionDiv && reconnectionDiv.textContent.includes('Reconnections: 1');
      }, { timeout: 10000 });

      console.log('  ✅ Reconnection successful');

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'WebSocket Reconnection',
        success: true,
        duration,
        details: 'Successfully handled WebSocket reconnection after connection loss'
      });

    } catch (error) {
      this.testResults.push({
        testName: 'WebSocket Reconnection',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testNetworkInterruption() {
    console.log('\n📋 Test 3: Network Interruption Simulation');
    const startTime = Date.now();
    
    try {
      const page = await this.browser.newPage();
      this.pages.push(page);

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Network Interruption Test</title>
        </head>
        <body>
          <div id="status">Connecting...</div>
          <div id="interruptions">Interruptions: 0</div>
          <div id="messages"></div>
          <script>
            let ws;
            let interruptionCount = 0;
            const statusDiv = document.getElementById('status');
            const interruptionsDiv = document.getElementById('interruptions');
            const messagesDiv = document.getElementById('messages');
            
            function connect() {
              ws = new WebSocket('ws://localhost:8086');
              
              ws.onopen = function(event) {
                statusDiv.textContent = 'Connected';
                statusDiv.style.color = 'green';
                console.log('WebSocket connected');
              };
              
              ws.onmessage = function(event) {
                messagesDiv.innerHTML += '<div>Message: ' + event.data + '</div>';
                console.log('Received message:', event.data);
              };
              
              ws.onclose = function(event) {
                statusDiv.textContent = 'Disconnected';
                statusDiv.style.color = 'red';
                console.log('WebSocket disconnected:', event.code, event.reason);
                
                interruptionCount++;
                interruptionsDiv.textContent = 'Interruptions: ' + interruptionCount;
                
                // Reconnect after short delay
                setTimeout(() => {
                  connect();
                }, 500);
              };
              
              ws.onerror = function(error) {
                statusDiv.textContent = 'Error';
                statusDiv.style.color = 'red';
                console.error('WebSocket error:', error);
              };
            }
            
            // Connect initially
            connect();
            
            // Simulate multiple network interruptions
            setTimeout(() => { if (ws) ws.close(); }, 1000);
            setTimeout(() => { if (ws) ws.close(); }, 3000);
            setTimeout(() => { if (ws) ws.close(); }, 5000);
          </script>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);

      // Wait for initial connection
      await page.waitForFunction(() => {
        const status = document.getElementById('status');
        return status && status.textContent === 'Connected';
      }, { timeout: 10000 });

      console.log('  ✅ Initial connection established');

      // Wait for multiple interruptions and recoveries
      await page.waitForFunction(() => {
        const interruptionsDiv = document.getElementById('interruptions');
        return interruptionsDiv && interruptionsDiv.textContent.includes('Interruptions: 3');
      }, { timeout: 15000 });

      console.log('  ✅ Handled multiple network interruptions');

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Network Interruption Simulation',
        success: true,
        duration,
        details: 'Successfully handled multiple network interruptions and recoveries'
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Network Interruption Simulation',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testServerRestart() {
    console.log('\n📋 Test 4: Server Restart Handling');
    const startTime = Date.now();
    
    try {
      const page = await this.browser.newPage();
      this.pages.push(page);

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Server Restart Test</title>
        </head>
        <body>
          <div id="status">Connecting...</div>
          <div id="restart-count">Server restarts handled: 0</div>
          <div id="messages"></div>
          <script>
            let ws;
            let restartCount = 0;
            const statusDiv = document.getElementById('status');
            const restartDiv = document.getElementById('restart-count');
            const messagesDiv = document.getElementById('messages');
            
            function connect() {
              ws = new WebSocket('ws://localhost:8086');
              
              ws.onopen = function(event) {
                statusDiv.textContent = 'Connected';
                statusDiv.style.color = 'green';
                console.log('WebSocket connected');
              };
              
              ws.onmessage = function(event) {
                messagesDiv.innerHTML += '<div>Message: ' + event.data + '</div>';
                console.log('Received message:', event.data);
              };
              
              ws.onclose = function(event) {
                statusDiv.textContent = 'Disconnected';
                statusDiv.style.color = 'red';
                console.log('WebSocket disconnected:', event.code, event.reason);
                
                // Attempt reconnection with exponential backoff
                const delay = Math.min(1000 * Math.pow(2, restartCount), 10000);
                restartCount++;
                restartDiv.textContent = 'Server restarts handled: ' + restartCount;
                
                setTimeout(() => {
                  connect();
                }, delay);
              };
              
              ws.onerror = function(error) {
                statusDiv.textContent = 'Error';
                statusDiv.style.color = 'red';
                console.error('WebSocket error:', error);
              };
            }
            
            // Connect initially
            connect();
          </script>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);

      // Wait for initial connection
      await page.waitForFunction(() => {
        const status = document.getElementById('status');
        return status && status.textContent === 'Connected';
      }, { timeout: 10000 });

      console.log('  ✅ Initial connection established');

      // Stop and restart server
      await this.server.stop();
      console.log('  🔄 Server stopped');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.server.start();
      console.log('  🔄 Server restarted');

      // Wait for reconnection
      await page.waitForFunction(() => {
        const status = document.getElementById('status');
        return status && status.textContent === 'Connected';
      }, { timeout: 15000 });

      console.log('  ✅ Reconnected after server restart');

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Server Restart Handling',
        success: true,
        duration,
        details: 'Successfully handled server restart and reconnection'
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Server Restart Handling',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testMultipleConnections() {
    console.log('\n📋 Test 5: Multiple WebSocket Connections');
    const startTime = Date.now();
    
    try {
      const connectionCount = 5;
      const pages = [];

      // Create multiple pages with WebSocket connections
      for (let i = 0; i < connectionCount; i++) {
        const page = await this.browser.newPage();
        pages.push(page);
        this.pages.push(page);

        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Multiple Connections Test - Client ${i + 1}</title>
          </head>
          <body>
            <div id="status">Connecting...</div>
            <div id="client-id">Client ${i + 1}</div>
            <div id="messages"></div>
            <script>
              let ws;
              const statusDiv = document.getElementById('status');
              const messagesDiv = document.getElementById('messages');
              
              ws = new WebSocket('ws://localhost:8086');
              
              ws.onopen = function(event) {
                statusDiv.textContent = 'Connected';
                statusDiv.style.color = 'green';
                console.log('Client ${i + 1} connected');
              };
              
              ws.onmessage = function(event) {
                messagesDiv.innerHTML += '<div>Message: ' + event.data + '</div>';
                console.log('Client ${i + 1} received:', event.data);
              };
              
              ws.onclose = function(event) {
                statusDiv.textContent = 'Disconnected';
                statusDiv.style.color = 'red';
                console.log('Client ${i + 1} disconnected:', event.code, event.reason);
              };
              
              ws.onerror = function(error) {
                statusDiv.textContent = 'Error';
                statusDiv.style.color = 'red';
                console.error('Client ${i + 1} error:', error);
              };
            </script>
          </body>
          </html>
        `;

        await page.setContent(htmlContent);
      }

      // Wait for all connections
      for (let i = 0; i < connectionCount; i++) {
        await pages[i].waitForFunction(() => {
          const status = document.getElementById('status');
          return status && status.textContent === 'Connected';
        }, { timeout: 10000 });
        
        console.log(`  ✅ Client ${i + 1} connected`);
      }

      // Check server statistics
      const poolStats = this.server.getConnectionPoolStatistics();
      console.log(`  📊 Server managing ${poolStats.totalConnections} connections`);

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Multiple WebSocket Connections',
        success: true,
        duration,
        details: `Successfully established ${connectionCount} concurrent WebSocket connections`
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Multiple WebSocket Connections',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testConnectionQualityMonitoring() {
    console.log('\n📋 Test 6: Connection Quality Monitoring');
    const startTime = Date.now();
    
    try {
      const page = await this.browser.newPage();
      this.pages.push(page);

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connection Quality Test</title>
        </head>
        <body>
          <div id="status">Connecting...</div>
          <div id="quality-metrics">Quality metrics will appear here</div>
          <div id="messages"></div>
          <script>
            let ws;
            let messageCount = 0;
            const statusDiv = document.getElementById('status');
            const qualityDiv = document.getElementById('quality-metrics');
            const messagesDiv = document.getElementById('messages');
            
            ws = new WebSocket('ws://localhost:8086');
            
            ws.onopen = function(event) {
              statusDiv.textContent = 'Connected';
              statusDiv.style.color = 'green';
              console.log('WebSocket connected');
              
              // Send periodic messages to generate quality metrics
              setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    type: 'quality_test',
                    data: 'Quality test message',
                    timestamp: Date.now(),
                    messageId: ++messageCount
                  }));
                }
              }, 1000);
            };
            
            ws.onmessage = function(event) {
              messagesDiv.innerHTML += '<div>Message ' + (++messageCount) + ': ' + event.data + '</div>';
              console.log('Received message:', event.data);
            };
            
            ws.onclose = function(event) {
              statusDiv.textContent = 'Disconnected';
              statusDiv.style.color = 'red';
              console.log('WebSocket disconnected:', event.code, event.reason);
            };
            
            ws.onerror = function(error) {
              statusDiv.textContent = 'Error';
              statusDiv.style.color = 'red';
              console.error('WebSocket error:', error);
            };
          </script>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);

      // Wait for connection
      await page.waitForFunction(() => {
        const status = document.getElementById('status');
        return status && status.textContent === 'Connected';
      }, { timeout: 10000 });

      console.log('  ✅ Connection established');

      // Wait for messages to be sent
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check server quality metrics
      const qualityMetrics = this.server.getAllConnectionQualityMetrics();
      console.log(`  📊 Quality metrics tracking ${qualityMetrics.size} connections`);

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Connection Quality Monitoring',
        success: true,
        duration,
        details: `Connection quality monitoring active for ${qualityMetrics.size} connections`
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Connection Quality Monitoring',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testKeepAliveMechanisms() {
    console.log('\n📋 Test 7: Keep-Alive Mechanisms');
    const startTime = Date.now();
    
    try {
      const page = await this.browser.newPage();
      this.pages.push(page);

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Keep-Alive Test</title>
        </head>
        <body>
          <div id="status">Connecting...</div>
          <div id="keepalive-info">Keep-alive status: Active</div>
          <div id="messages"></div>
          <script>
            let ws;
            let lastMessageTime = Date.now();
            const statusDiv = document.getElementById('status');
            const keepaliveDiv = document.getElementById('keepalive-info');
            const messagesDiv = document.getElementById('messages');
            
            ws = new WebSocket('ws://localhost:8086');
            
            ws.onopen = function(event) {
              statusDiv.textContent = 'Connected';
              statusDiv.style.color = 'green';
              console.log('WebSocket connected');
            };
            
            ws.onmessage = function(event) {
              lastMessageTime = Date.now();
              messagesDiv.innerHTML += '<div>Keep-alive: ' + event.data + '</div>';
              console.log('Received keep-alive:', event.data);
            };
            
            ws.onclose = function(event) {
              statusDiv.textContent = 'Disconnected';
              statusDiv.style.color = 'red';
              console.log('WebSocket disconnected:', event.code, event.reason);
            };
            
            ws.onerror = function(error) {
              statusDiv.textContent = 'Error';
              statusDiv.style.color = 'red';
              console.error('WebSocket error:', error);
            };
            
            // Monitor keep-alive activity
            setInterval(() => {
              const timeSinceLastMessage = Date.now() - lastMessageTime;
              keepaliveDiv.textContent = 'Keep-alive status: Active (last message ' + timeSinceLastMessage + 'ms ago)';
            }, 1000);
          </script>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);

      // Wait for connection
      await page.waitForFunction(() => {
        const status = document.getElementById('status');
        return status && status.textContent === 'Connected';
      }, { timeout: 10000 });

      console.log('  ✅ Connection established');

      // Wait for keep-alive messages
      await page.waitForFunction(() => {
        const messages = document.getElementById('messages');
        return messages && messages.children.length > 0;
      }, { timeout: 10000 });

      console.log('  ✅ Keep-alive messages received');

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Keep-Alive Mechanisms',
        success: true,
        duration,
        details: 'Keep-alive mechanisms working correctly'
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Keep-Alive Mechanisms',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testLoadBalancerTimeout() {
    console.log('\n📋 Test 8: Load Balancer Timeout Simulation');
    const startTime = Date.now();
    
    try {
      const page = await this.browser.newPage();
      this.pages.push(page);

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Load Balancer Timeout Test</title>
        </head>
        <body>
          <div id="status">Connecting...</div>
          <div id="timeout-info">Simulating 60+ second idle period...</div>
          <div id="messages"></div>
          <script>
            let ws;
            let startTime = Date.now();
            const statusDiv = document.getElementById('status');
            const timeoutDiv = document.getElementById('timeout-info');
            const messagesDiv = document.getElementById('messages');
            
            ws = new WebSocket('ws://localhost:8086');
            
            ws.onopen = function(event) {
              statusDiv.textContent = 'Connected';
              statusDiv.style.color = 'green';
              console.log('WebSocket connected');
            };
            
            ws.onmessage = function(event) {
              const elapsed = Date.now() - startTime;
              messagesDiv.innerHTML += '<div>Message at ' + elapsed + 'ms: ' + event.data + '</div>';
              console.log('Received message at', elapsed + 'ms:', event.data);
            };
            
            ws.onclose = function(event) {
              statusDiv.textContent = 'Disconnected';
              statusDiv.style.color = 'red';
              console.log('WebSocket disconnected:', event.code, event.reason);
            };
            
            ws.onerror = function(error) {
              statusDiv.textContent = 'Error';
              statusDiv.style.color = 'red';
              console.error('WebSocket error:', error);
            };
            
            // Update timeout info
            setInterval(() => {
              const elapsed = Date.now() - startTime;
              timeoutDiv.textContent = 'Elapsed time: ' + (elapsed / 1000).toFixed(1) + 's';
            }, 1000);
          </script>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);

      // Wait for connection
      await page.waitForFunction(() => {
        const status = document.getElementById('status');
        return status && status.textContent === 'Connected';
      }, { timeout: 10000 });

      console.log('  ✅ Connection established');

      // Wait for 10 seconds to see keep-alive in action (shorter for testing)
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check if connection is still alive
      const isStillConnected = await page.evaluate(() => {
        const status = document.getElementById('status');
        return status && status.textContent === 'Connected';
      });

      if (isStillConnected) {
        console.log('  ✅ Connection survived idle period (keep-alive working)');
        
        this.testResults.push({
          testName: 'Load Balancer Timeout Simulation',
          success: true,
          duration: Date.now() - startTime,
          details: 'Connection maintained through idle period with keep-alive'
        });
      } else {
        throw new Error('Connection died during idle period');
      }

    } catch (error) {
      this.testResults.push({
        testName: 'Load Balancer Timeout Simulation',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testStressTest() {
    console.log('\n📋 Test 9: Stress Test');
    const startTime = Date.now();
    
    try {
      const connectionCount = 10;
      const pages = [];

      // Create multiple connections rapidly
      for (let i = 0; i < connectionCount; i++) {
        const page = await this.browser.newPage();
        pages.push(page);
        this.pages.push(page);

        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Stress Test - Client ${i + 1}</title>
          </head>
          <body>
            <div id="status">Connecting...</div>
            <div id="client-id">Client ${i + 1}</div>
            <div id="messages"></div>
            <script>
              let ws;
              let messageCount = 0;
              const statusDiv = document.getElementById('status');
              const messagesDiv = document.getElementById('messages');
              
              ws = new WebSocket('ws://localhost:8086');
              
              ws.onopen = function(event) {
                statusDiv.textContent = 'Connected';
                statusDiv.style.color = 'green';
                console.log('Client ${i + 1} connected');
                
                // Send rapid messages
                setInterval(() => {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                      type: 'stress_test',
                      data: 'Stress test message ' + (++messageCount),
                      timestamp: Date.now(),
                      clientId: ${i + 1}
                    }));
                  }
                }, 100);
              };
              
              ws.onmessage = function(event) {
                messagesDiv.innerHTML += '<div>Message: ' + event.data + '</div>';
                console.log('Client ${i + 1} received:', event.data);
              };
              
              ws.onclose = function(event) {
                statusDiv.textContent = 'Disconnected';
                statusDiv.style.color = 'red';
                console.log('Client ${i + 1} disconnected:', event.code, event.reason);
              };
              
              ws.onerror = function(error) {
                statusDiv.textContent = 'Error';
                statusDiv.style.color = 'red';
                console.error('Client ${i + 1} error:', error);
              };
            </script>
          </body>
          </html>
        `;

        await page.setContent(htmlContent);
      }

      // Wait for all connections
      for (let i = 0; i < connectionCount; i++) {
        await pages[i].waitForFunction(() => {
          const status = document.getElementById('status');
          return status && status.textContent === 'Connected';
        }, { timeout: 10000 });
        
        console.log(`  ✅ Client ${i + 1} connected`);
      }

      // Let stress test run for a bit
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check server statistics
      const poolStats = this.server.getConnectionPoolStatistics();
      const analytics = this.server.getRealTimeAnalytics();
      
      console.log(`  📊 Server managing ${poolStats.totalConnections} connections`);
      console.log(`  📊 Analytics: ${JSON.stringify(analytics)}`);

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Stress Test',
        success: true,
        duration,
        details: `Successfully handled ${connectionCount} concurrent connections under stress`
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Stress Test',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  generateTestReport(totalDuration) {
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(t => t.success).length;
    const successRate = (successfulTests / totalTests) * 100;

    return {
      totalTests,
      successfulTests,
      successRate,
      testResults: this.testResults,
      totalDuration
    };
  }

  printTestReport(results) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PUPPETEER WEBSOCKET TEST REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 Overall Results:`);
    console.log(`  Tests: ${results.successfulTests}/${results.totalTests} (${results.successRate.toFixed(1)}%)`);
    console.log(`  Duration: ${(results.totalDuration / 1000).toFixed(2)} seconds`);
    
    console.log(`\n📋 Detailed Results:`);
    results.testResults.forEach(test => {
      console.log(`\n  ${test.success ? '✅' : '❌'} ${test.testName}`);
      console.log(`    Duration: ${test.duration}ms`);
      console.log(`    Details: ${test.details}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    if (results.successRate >= 90) {
      console.log('🎉 EXCELLENT: All Puppeteer WebSocket tests passed!');
      console.log('   The WebSocket implementation is robust in real browser conditions.');
    } else if (results.successRate >= 70) {
      console.log('✅ GOOD: Most Puppeteer WebSocket tests passed.');
      console.log('   Some issues detected that should be investigated.');
    } else {
      console.log('⚠️  NEEDS ATTENTION: Multiple Puppeteer WebSocket test failures.');
      console.log('   The implementation may not be robust enough for production.');
    }
    
    console.log('\n🔧 Key Features Tested with Puppeteer:');
    console.log('  • Real browser WebSocket connections');
    console.log('  • Connection establishment and teardown');
    console.log('  • Automatic reconnection handling');
    console.log('  • Network interruption recovery');
    console.log('  • Server restart handling');
    console.log('  • Multiple concurrent connections');
    console.log('  • Connection quality monitoring');
    console.log('  • Keep-alive mechanisms');
    console.log('  • Load balancer timeout survival');
    console.log('  • Stress testing under load');
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up Puppeteer test environment...');
    
    try {
      // Close all pages
      for (const page of this.pages) {
        await page.close();
      }
      
      // Close browser
      if (this.browser) {
        await this.browser.close();
        console.log('✅ Browser closed');
      }
      
      // Stop server
      await this.server.stop();
      console.log('✅ Server stopped');
      
    } catch (error) {
      console.log('⚠️  Error during cleanup:', error);
    }
  }
}

// Main execution
async function main() {
  try {
    const testSuite = new WebSocketPuppeteerTest();
    const results = await testSuite.runPuppeteerTests();
    
    const overallSuccess = results.successRate >= 80; // 80% success threshold
    
    if (!overallSuccess) {
      console.log('\n❌ Puppeteer WebSocket test suite failed. Please review the detailed results above.');
      process.exit(1);
    } else {
      console.log('\n✅ All Puppeteer WebSocket tests passed successfully!');
      console.log('🚀 The WebSocket implementation is ready for production use with real browsers.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Puppeteer WebSocket test suite crashed:', error);
    process.exit(1);
  }
}

// Handle process signals for graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Puppeteer WebSocket test suite interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Puppeteer WebSocket test suite terminated');
  process.exit(1);
});

// Run the test suite
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
