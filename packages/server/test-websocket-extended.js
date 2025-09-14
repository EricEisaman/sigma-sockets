/**
 * Extended WebSocket Test with 30-Second Duration and Keep-Alive Tracking
 * 
 * This test runs multiple WebSocket connections for 30 seconds and tracks
 * keep-alive actions for each connection as required by DoD standards.
 */

import { SigmaSocketServer } from './dist/index.js';
import puppeteer from 'puppeteer';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

class ExtendedWebSocketTest {
  constructor() {
    this.testResults = {
      sessionId: `test_${Date.now()}`,
      startTime: Date.now(),
      endTime: null,
      connections: [],
      keepAliveStats: {
        totalKeepAlives: 0,
        keepAlivesPerConnection: {},
        averageKeepAliveInterval: 0,
        keepAliveSuccessRate: 0
      },
      performanceMetrics: {
        totalConnections: 0,
        successfulConnections: 0,
        failedConnections: 0,
        averageConnectionTime: 0,
        maxConcurrentConnections: 0
      }
    };
  }

  async runTest() {
    console.log('🚀 Starting Extended WebSocket Test (30 seconds)...');
    
    let server;
    const port = 8093;
    const testDuration = 30000; // 30 seconds

    try {
      // Start server
      server = new SigmaSocketServer({
        port: port,
        heartbeatInterval: 2000, // 2 second heartbeat
        adaptiveHeartbeatEnabled: true,
        debug: true,
        connectionQualityThreshold: 0.7,
        minHeartbeatInterval: 1000,
        maxHeartbeatInterval: 10000,
        latencyWindowSize: 10,
        maxConnections: 100,
        sessionTimeout: 30000,
      });
      
      await server.start();
      console.log(`✅ Server started on port ${port}`);

      // Launch Puppeteer browser
      const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });

      const page = await browser.newPage();
      
      // Set up console logging from browser
      page.on('console', msg => {
        console.log(`🌐 [BROWSER] ${msg.text()}`);
      });

      // Set up page error handling
      page.on('pageerror', error => {
        console.error(`🌐 [BROWSER ERROR] ${error.message}`);
      });

      // Create extended test HTML
      const testHTML = this.createExtendedTestHTML(port, testDuration);
      await page.setContent(testHTML);
      
      console.log('✅ Extended test page loaded');
      
      // Wait for test to complete
      console.log(`⏱️ Running test for ${testDuration / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, testDuration + 2000)); // Extra 2 seconds for cleanup
      
      // Get test results from browser
      const browserResults = await page.evaluate(() => {
        return window.testResults;
      });

      // Merge browser results with our tracking
      this.testResults.endTime = Date.now();
      this.testResults.connections = browserResults.connections || [];
      this.testResults.keepAliveStats = browserResults.keepAliveStats || this.testResults.keepAliveStats;
      this.testResults.performanceMetrics = browserResults.performanceMetrics || this.testResults.performanceMetrics;

      console.log('\n📊 Extended Test Results:');
      console.log(`   - Duration: ${(this.testResults.endTime - this.testResults.startTime) / 1000}s`);
      console.log(`   - Total Connections: ${this.testResults.performanceMetrics.totalConnections}`);
      console.log(`   - Successful Connections: ${this.testResults.performanceMetrics.successfulConnections}`);
      console.log(`   - Total Keep-Alives: ${this.testResults.keepAliveStats.totalKeepAlives}`);
      console.log(`   - Keep-Alive Success Rate: ${this.testResults.keepAliveStats.keepAliveSuccessRate.toFixed(1)}%`);

      // Close browser
      await browser.close();

      console.log('\n🎉 Extended WebSocket test completed successfully!');

    } catch (error) {
      console.error('❌ Extended WebSocket test failed:', error);
      throw error;
    } finally {
      if (server) {
        await server.stop();
        console.log('✅ Server stopped');
      }
    }
  }

  createExtendedTestHTML(port, duration) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extended WebSocket Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f0f0f0;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .log {
            background: #1e1e1e;
            color: #00ff00;
            padding: 15px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            height: 400px;
            overflow-y: auto;
            margin: 10px 0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #007bff;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }
        .stat-label {
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Extended WebSocket Test (30 seconds)</h1>
        <div id="status">Starting test...</div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value" id="connectionCount">0</div>
                <div class="stat-label">Active Connections</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="keepAliveCount">0</div>
                <div class="stat-label">Total Keep-Alives</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="successRate">0%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="elapsedTime">0s</div>
                <div class="stat-label">Elapsed Time</div>
            </div>
        </div>
        
        <div id="log" class="log"></div>
    </div>

    <script>
        // Test configuration
        const TEST_DURATION = ${duration};
        const MAX_CONNECTIONS = 10;
        const KEEP_ALIVE_INTERVAL = 2000; // 2 seconds
        
        // Test state
        let testResults = {
            sessionId: 'test_' + Date.now(),
            startTime: Date.now(),
            connections: [],
            keepAliveStats: {
                totalKeepAlives: 0,
                keepAlivesPerConnection: {},
                averageKeepAliveInterval: 0,
                keepAliveSuccessRate: 0
            },
            performanceMetrics: {
                totalConnections: 0,
                successfulConnections: 0,
                failedConnections: 0,
                averageConnectionTime: 0,
                maxConcurrentConnections: 0
            }
        };
        
        let activeConnections = [];
        let testStartTime = Date.now();
        let testEndTime = null;
        
        // Logging function
        function log(message) {
            const logElement = document.getElementById('log');
            const timestamp = new Date().toISOString();
            logElement.innerHTML += '[' + timestamp + '] ' + message + '\\n';
            logElement.scrollTop = logElement.scrollHeight;
            console.log(message);
        }
        
        // Update stats display
        function updateStats() {
            document.getElementById('connectionCount').textContent = activeConnections.length;
            document.getElementById('keepAliveCount').textContent = testResults.keepAliveStats.totalKeepAlives;
            document.getElementById('successRate').textContent = 
                testResults.performanceMetrics.totalConnections > 0 ? 
                Math.round((testResults.performanceMetrics.successfulConnections / testResults.performanceMetrics.totalConnections) * 100) + '%' : '0%';
            
            const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
            document.getElementById('elapsedTime').textContent = elapsed + 's';
        }
        
        // Create WebSocket connection
        function createConnection(connectionId) {
            return new Promise((resolve, reject) => {
                const ws = new WebSocket('ws://localhost:${port}');
                const connection = {
                    id: connectionId,
                    ws: ws,
                    startTime: Date.now(),
                    keepAliveCount: 0,
                    lastKeepAlive: null,
                    isAlive: true
                };
                
                ws.onopen = function() {
                    log('✅ Connection ' + connectionId + ' established');
                    connection.connected = true;
                    testResults.performanceMetrics.successfulConnections++;
                    resolve(connection);
                };
                
                ws.onmessage = function(event) {
                    // Track keep-alive responses
                    if (event.data.includes('heartbeat') || event.data.includes('pong')) {
                        connection.keepAliveCount++;
                        connection.lastKeepAlive = Date.now();
                        testResults.keepAliveStats.totalKeepAlives++;
                        
                        if (!testResults.keepAliveStats.keepAlivesPerConnection[connectionId]) {
                            testResults.keepAliveStats.keepAlivesPerConnection[connectionId] = 0;
                        }
                        testResults.keepAliveStats.keepAlivesPerConnection[connectionId]++;
                        
                        log('💓 Keep-alive received for connection ' + connectionId + ' (total: ' + connection.keepAliveCount + ')');
                    }
                };
                
                ws.onclose = function() {
                    log('🔌 Connection ' + connectionId + ' closed');
                    connection.connected = false;
                    connection.endTime = Date.now();
                };
                
                ws.onerror = function(error) {
                    log('❌ Connection ' + connectionId + ' error: ' + error);
                    testResults.performanceMetrics.failedConnections++;
                    reject(error);
                };
                
                testResults.performanceMetrics.totalConnections++;
            });
        }
        
        // Send keep-alive message
        function sendKeepAlive(connection) {
            if (connection.ws.readyState === WebSocket.OPEN) {
                const keepAliveMessage = {
                    type: 'heartbeat',
                    timestamp: Date.now(),
                    connectionId: connection.id
                };
                connection.ws.send(JSON.stringify(keepAliveMessage));
                log('💓 Keep-alive sent for connection ' + connection.id);
            }
        }
        
        // Start the extended test
        async function startExtendedTest() {
            log('🚀 Starting extended WebSocket test for ' + (TEST_DURATION / 1000) + ' seconds...');
            document.getElementById('status').textContent = 'Running extended test...';
            
            // Create initial connections
            for (let i = 0; i < MAX_CONNECTIONS; i++) {
                try {
                    const connection = await createConnection('conn_' + i);
                    activeConnections.push(connection);
                    testResults.connections.push(connection);
                    testResults.performanceMetrics.maxConcurrentConnections = Math.max(
                        testResults.performanceMetrics.maxConcurrentConnections, 
                        activeConnections.length
                    );
                    
                    // Start keep-alive for this connection
                    const keepAliveInterval = setInterval(() => {
                        if (connection.connected) {
                            sendKeepAlive(connection);
                        } else {
                            clearInterval(keepAliveInterval);
                        }
                    }, KEEP_ALIVE_INTERVAL);
                    
                    // Store interval for cleanup
                    connection.keepAliveInterval = keepAliveInterval;
                    
                } catch (error) {
                    log('❌ Failed to create connection ' + i + ': ' + error);
                }
            }
            
            // Update stats every second
            const statsInterval = setInterval(updateStats, 1000);
            
            // Test duration timer
            setTimeout(() => {
                testEndTime = Date.now();
                log('⏰ Test duration completed (' + (TEST_DURATION / 1000) + ' seconds)');
                
                // Cleanup
                clearInterval(statsInterval);
                activeConnections.forEach(connection => {
                    if (connection.keepAliveInterval) {
                        clearInterval(connection.keepAliveInterval);
                    }
                    if (connection.ws) {
                        connection.ws.close();
                    }
                });
                
                // Calculate final metrics
                testResults.performanceMetrics.averageConnectionTime = 
                    testResults.connections.reduce((sum, conn) => sum + (conn.endTime || Date.now() - conn.startTime), 0) / 
                    testResults.connections.length;
                
                testResults.keepAliveStats.averageKeepAliveInterval = 
                    testResults.keepAliveStats.totalKeepAlives > 0 ? 
                    TEST_DURATION / testResults.keepAliveStats.totalKeepAlives : 0;
                
                testResults.keepAliveStats.keepAliveSuccessRate = 
                    testResults.performanceMetrics.successfulConnections > 0 ? 
                    (testResults.keepAliveStats.totalKeepAlives / (testResults.performanceMetrics.successfulConnections * (TEST_DURATION / KEEP_ALIVE_INTERVAL))) * 100 : 0;
                
                log('📊 Final Results:');
                log('   - Total Connections: ' + testResults.performanceMetrics.totalConnections);
                log('   - Successful Connections: ' + testResults.performanceMetrics.successfulConnections);
                log('   - Total Keep-Alives: ' + testResults.keepAliveStats.totalKeepAlives);
                log('   - Keep-Alive Success Rate: ' + testResults.keepAliveStats.keepAliveSuccessRate.toFixed(1) + '%');
                log('   - Average Keep-Alive Interval: ' + testResults.keepAliveStats.averageKeepAliveInterval.toFixed(0) + 'ms');
                
                document.getElementById('status').textContent = 'Test completed successfully!';
                
                // Make results available globally
                window.testResults = testResults;
                
            }, TEST_DURATION);
        }
        
        // Start the test when page loads
        window.addEventListener('load', startExtendedTest);
    </script>
</body>
</html>`;
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsPath = join(process.cwd(), 'test-results', `extended-test-results-${timestamp}.json`);
    
    // Ensure directory exists
    const testResultsDir = join(process.cwd(), 'test-results');
    if (!existsSync(testResultsDir)) {
      writeFileSync(testResultsDir, '', { flag: 'w' });
    }
    
    writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
    console.log(`✅ Test results saved: ${resultsPath}`);
    return resultsPath;
  }
}

// Run the extended test
async function runExtendedTest() {
  const test = new ExtendedWebSocketTest();
  try {
    await test.runTest();
    await test.saveResults();
    console.log('🎉 Extended WebSocket test completed successfully!');
  } catch (error) {
    console.error('❌ Extended test failed:', error);
    process.exit(1);
  }
}

runExtendedTest().catch(console.error);
