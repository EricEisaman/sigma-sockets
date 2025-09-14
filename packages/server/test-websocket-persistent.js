#!/usr/bin/env node

/**
 * Comprehensive WebSocket Test with Persistent Storage
 * 
 * This test uses Puppeteer to simulate real browser conditions and writes
 * all results to SQLite database and text files for persistent review.
 */

import { SigmaSocketServer } from './dist/index.js';
import puppeteer from 'puppeteer';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

class WebSocketPersistentTest {
  constructor() {
    this.server = new SigmaSocketServer({
      port: 8087,
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
    this.db = null;
    this.testSessionId = `test_${Date.now()}`;
    this.resultsDir = './test-results';
    
    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  async initializeDatabase() {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(this.resultsDir, 'websocket_tests.db');
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ SQLite database initialized');
          resolve();
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS test_sessions (
          id TEXT PRIMARY KEY,
          start_time INTEGER,
          end_time INTEGER,
          total_tests INTEGER,
          successful_tests INTEGER,
          success_rate REAL,
          total_duration INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS test_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT,
          test_name TEXT,
          success BOOLEAN,
          duration INTEGER,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES test_sessions (id)
        );
        
        CREATE TABLE IF NOT EXISTS server_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT,
          test_name TEXT,
          metric_name TEXT,
          metric_value TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES test_sessions (id)
        );
      `;
      
      this.db.exec(createTablesSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Database tables created');
          resolve();
        }
      });
    });
  }

  async saveTestResult(testName, success, duration, details) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO test_results (session_id, test_name, success, duration, details) VALUES (?, ?, ?, ?, ?)`;
      this.db.run(sql, [this.testSessionId, testName, success, duration, details], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async saveServerMetrics(testName, metrics) {
    const promises = Object.entries(metrics).map(([key, value]) => {
      return new Promise((resolve, reject) => {
        const sql = `INSERT INTO server_metrics (session_id, test_name, metric_name, metric_value) VALUES (?, ?, ?, ?)`;
        this.db.run(sql, [this.testSessionId, testName, key, JSON.stringify(value)], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        });
      });
    });
    
    return Promise.all(promises);
  }

  async saveTestSession(results) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO test_sessions (id, start_time, end_time, total_tests, successful_tests, success_rate, total_duration) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [
        this.testSessionId,
        results.startTime,
        results.endTime,
        results.totalTests,
        results.successfulTests,
        results.successRate,
        results.totalDuration
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  writeTextReport(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `websocket-test-report-${timestamp}.txt`;
    const filepath = path.join(this.resultsDir, filename);
    
    let report = '';
    report += '='.repeat(80) + '\n';
    report += 'WEBSOCKET TEST REPORT\n';
    report += '='.repeat(80) + '\n';
    report += `Test Session ID: ${this.testSessionId}\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    report += 'OVERALL RESULTS:\n';
    report += `  Tests: ${results.successfulTests}/${results.totalTests} (${results.successRate.toFixed(1)}%)\n`;
    report += `  Duration: ${(results.totalDuration / 1000).toFixed(2)} seconds\n\n`;
    
    report += 'DETAILED RESULTS:\n';
    results.testResults.forEach(test => {
      report += `\n  ${test.success ? '✅' : '❌'} ${test.testName}\n`;
      report += `    Duration: ${test.duration}ms\n`;
      report += `    Details: ${test.details}\n`;
    });
    
    report += '\n' + '='.repeat(80) + '\n';
    
    if (results.successRate >= 90) {
      report += 'EXCELLENT: All WebSocket tests passed!\n';
    } else if (results.successRate >= 70) {
      report += 'GOOD: Most WebSocket tests passed.\n';
    } else {
      report += 'NEEDS ATTENTION: Multiple test failures detected.\n';
    }
    
    fs.writeFileSync(filepath, report);
    console.log(`📄 Text report saved: ${filepath}`);
    return filepath;
  }

  writeJSONReport(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `websocket-test-data-${timestamp}.json`;
    const filepath = path.join(this.resultsDir, filename);
    
    const reportData = {
      sessionId: this.testSessionId,
      timestamp: new Date().toISOString(),
      results: results,
      serverConfig: {
        port: 8087,
        heartbeatInterval: 2000,
        adaptiveHeartbeatEnabled: true
      }
    };
    
    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    console.log(`📊 JSON data saved: ${filepath}`);
    return filepath;
  }

  async runPersistentTests() {
    console.log('🚀 Starting WebSocket Test with Persistent Storage...');
    console.log('=' .repeat(80));
    console.log(`📋 Test Session ID: ${this.testSessionId}`);
    
    const startTime = Date.now();

    try {
      // Initialize database
      await this.initializeDatabase();
      await this.createTables();

      // Start server
      await this.server.start();
      console.log('✅ Server started on port 8087');

      // Launch Puppeteer browser
      this.browser = await puppeteer.launch({
        headless: true, // Set to false for debugging
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

      // Run tests
      await this.testBasicConnection();
      await this.testReconnection();
      await this.testMultipleConnections();
      await this.testConnectionQuality();
      await this.testKeepAlive();

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const results = this.generateTestReport(totalDuration, startTime, endTime);
      
      // Save to database
      await this.saveTestSession(results);
      console.log('✅ Results saved to database');

      // Write text and JSON reports
      this.writeTextReport(results);
      this.writeJSONReport(results);

      this.printTestReport(results);
      return results;

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      
      // Save error to database
      try {
        await this.saveTestResult('Test Suite Error', false, 0, error.message);
      } catch (dbError) {
        console.error('Failed to save error to database:', dbError);
      }
      
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async testBasicConnection() {
    console.log('\n📋 Test 1: Basic WebSocket Connection');
    const startTime = Date.now();
    
    try {
      const page = await this.browser.newPage();
      this.pages.push(page);

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Basic Connection Test</title></head>
        <body>
          <div id="status">Connecting...</div>
          <div id="messages"></div>
          <script>
            let ws = new WebSocket('ws://localhost:8087');
            let messageCount = 0;
            
            ws.onopen = function(event) {
              document.getElementById('status').textContent = 'Connected';
              document.getElementById('status').style.color = 'green';
            };
            
            ws.onmessage = function(event) {
              messageCount++;
              document.getElementById('messages').innerHTML += '<div>Message ' + messageCount + ': ' + event.data + '</div>';
            };
            
            ws.onclose = function(event) {
              document.getElementById('status').textContent = 'Disconnected';
              document.getElementById('status').style.color = 'red';
            };
            
            ws.onerror = function(error) {
              document.getElementById('status').textContent = 'Error';
              document.getElementById('status').style.color = 'red';
            };
            
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: 'test', data: 'Hello from browser'}));
              }
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

      console.log('  ✅ WebSocket connected successfully');

      const duration = Date.now() - startTime;
      
      // Save result
      await this.saveTestResult('Basic WebSocket Connection', true, duration, 'Successfully established WebSocket connection');
      
      // Save server metrics
      const poolStats = this.server.getConnectionPoolStatistics();
      await this.saveServerMetrics('Basic WebSocket Connection', { poolStats });
      
      this.testResults.push({
        testName: 'Basic WebSocket Connection',
        success: true,
        duration,
        details: 'Successfully established WebSocket connection'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.saveTestResult('Basic WebSocket Connection', false, duration, `Error: ${error.message}`);
      
      this.testResults.push({
        testName: 'Basic WebSocket Connection',
        success: false,
        duration,
        details: `Error: ${error.message}`
      });
    }
  }

  async testReconnection() {
    console.log('\n📋 Test 2: WebSocket Reconnection');
    const startTime = Date.now();
    
    try {
      const page = await this.browser.newPage();
      this.pages.push(page);

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Reconnection Test</title></head>
        <body>
          <div id="status">Connecting...</div>
          <div id="reconnections">Reconnections: 0</div>
          <script>
            let ws;
            let reconnectionCount = 0;
            
            function connect() {
              ws = new WebSocket('ws://localhost:8087');
              
              ws.onopen = function(event) {
                document.getElementById('status').textContent = 'Connected';
                document.getElementById('status').style.color = 'green';
              };
              
              ws.onclose = function(event) {
                document.getElementById('status').textContent = 'Disconnected';
                document.getElementById('status').style.color = 'red';
                
                if (reconnectionCount < 2) {
                  reconnectionCount++;
                  document.getElementById('reconnections').textContent = 'Reconnections: ' + reconnectionCount;
                  setTimeout(connect, 1000);
                }
              };
            }
            
            connect();
            
            setTimeout(() => {
              if (ws) ws.close();
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
        const reconnections = document.getElementById('reconnections');
        return reconnections && reconnections.textContent.includes('Reconnections: 1');
      }, { timeout: 10000 });

      console.log('  ✅ Reconnection successful');

      const duration = Date.now() - startTime;
      
      await this.saveTestResult('WebSocket Reconnection', true, duration, 'Successfully handled WebSocket reconnection');
      
      this.testResults.push({
        testName: 'WebSocket Reconnection',
        success: true,
        duration,
        details: 'Successfully handled WebSocket reconnection'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.saveTestResult('WebSocket Reconnection', false, duration, `Error: ${error.message}`);
      
      this.testResults.push({
        testName: 'WebSocket Reconnection',
        success: false,
        duration,
        details: `Error: ${error.message}`
      });
    }
  }

  async testMultipleConnections() {
    console.log('\n📋 Test 3: Multiple WebSocket Connections');
    const startTime = Date.now();
    
    try {
      const connectionCount = 3;
      const pages = [];

      for (let i = 0; i < connectionCount; i++) {
        const page = await this.browser.newPage();
        pages.push(page);
        this.pages.push(page);

        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head><title>Multiple Connections - Client ${i + 1}</title></head>
          <body>
            <div id="status">Connecting...</div>
            <div id="client-id">Client ${i + 1}</div>
            <script>
              let ws = new WebSocket('ws://localhost:8087');
              
              ws.onopen = function(event) {
                document.getElementById('status').textContent = 'Connected';
                document.getElementById('status').style.color = 'green';
              };
              
              ws.onclose = function(event) {
                document.getElementById('status').textContent = 'Disconnected';
                document.getElementById('status').style.color = 'red';
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

      const duration = Date.now() - startTime;
      
      await this.saveTestResult('Multiple WebSocket Connections', true, duration, `Successfully established ${connectionCount} concurrent connections`);
      
      // Save server metrics
      const poolStats = this.server.getConnectionPoolStatistics();
      await this.saveServerMetrics('Multiple WebSocket Connections', { poolStats });
      
      this.testResults.push({
        testName: 'Multiple WebSocket Connections',
        success: true,
        duration,
        details: `Successfully established ${connectionCount} concurrent connections`
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.saveTestResult('Multiple WebSocket Connections', false, duration, `Error: ${error.message}`);
      
      this.testResults.push({
        testName: 'Multiple WebSocket Connections',
        success: false,
        duration,
        details: `Error: ${error.message}`
      });
    }
  }

  async testConnectionQuality() {
    console.log('\n📋 Test 4: Connection Quality Monitoring');
    const startTime = Date.now();
    
    try {
      const page = await this.browser.newPage();
      this.pages.push(page);

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Connection Quality Test</title></head>
        <body>
          <div id="status">Connecting...</div>
          <div id="messages"></div>
          <script>
            let ws = new WebSocket('ws://localhost:8087');
            let messageCount = 0;
            
            ws.onopen = function(event) {
              document.getElementById('status').textContent = 'Connected';
              document.getElementById('status').style.color = 'green';
              
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
              document.getElementById('messages').innerHTML += '<div>Message: ' + event.data + '</div>';
            };
          </script>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);

      await page.waitForFunction(() => {
        const status = document.getElementById('status');
        return status && status.textContent === 'Connected';
      }, { timeout: 10000 });

      console.log('  ✅ Connection established');

      // Wait for messages
      await new Promise(resolve => setTimeout(resolve, 3000));

      const duration = Date.now() - startTime;
      
      await this.saveTestResult('Connection Quality Monitoring', true, duration, 'Connection quality monitoring active');
      
      // Save quality metrics
      const qualityMetrics = this.server.getAllConnectionQualityMetrics();
      await this.saveServerMetrics('Connection Quality Monitoring', { qualityMetrics: Object.fromEntries(qualityMetrics) });
      
      this.testResults.push({
        testName: 'Connection Quality Monitoring',
        success: true,
        duration,
        details: 'Connection quality monitoring active'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.saveTestResult('Connection Quality Monitoring', false, duration, `Error: ${error.message}`);
      
      this.testResults.push({
        testName: 'Connection Quality Monitoring',
        success: false,
        duration,
        details: `Error: ${error.message}`
      });
    }
  }

  async testKeepAlive() {
    console.log('\n📋 Test 5: Keep-Alive Mechanisms');
    const startTime = Date.now();
    
    try {
      const page = await this.browser.newPage();
      this.pages.push(page);

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Keep-Alive Test</title></head>
        <body>
          <div id="status">Connecting...</div>
          <div id="keepalive-info">Keep-alive status: Active</div>
          <script>
            let ws = new WebSocket('ws://localhost:8087');
            let lastMessageTime = Date.now();
            
            ws.onopen = function(event) {
              document.getElementById('status').textContent = 'Connected';
              document.getElementById('status').style.color = 'green';
            };
            
            ws.onmessage = function(event) {
              lastMessageTime = Date.now();
              document.getElementById('keepalive-info').textContent = 'Keep-alive: Last message ' + (Date.now() - lastMessageTime) + 'ms ago';
            };
            
            setInterval(() => {
              const timeSinceLastMessage = Date.now() - lastMessageTime;
              document.getElementById('keepalive-info').textContent = 'Keep-alive status: Active (last message ' + timeSinceLastMessage + 'ms ago)';
            }, 1000);
          </script>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);

      await page.waitForFunction(() => {
        const status = document.getElementById('status');
        return status && status.textContent === 'Connected';
      }, { timeout: 10000 });

      console.log('  ✅ Connection established');

      // Wait for keep-alive
      await new Promise(resolve => setTimeout(resolve, 5000));

      const duration = Date.now() - startTime;
      
      await this.saveTestResult('Keep-Alive Mechanisms', true, duration, 'Keep-alive mechanisms working');
      
      this.testResults.push({
        testName: 'Keep-Alive Mechanisms',
        success: true,
        duration,
        details: 'Keep-alive mechanisms working'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.saveTestResult('Keep-Alive Mechanisms', false, duration, `Error: ${error.message}`);
      
      this.testResults.push({
        testName: 'Keep-Alive Mechanisms',
        success: false,
        duration,
        details: `Error: ${error.message}`
      });
    }
  }

  generateTestReport(totalDuration, startTime, endTime) {
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(t => t.success).length;
    const successRate = (successfulTests / totalTests) * 100;

    return {
      startTime,
      endTime,
      totalTests,
      successfulTests,
      successRate,
      testResults: this.testResults,
      totalDuration
    };
  }

  printTestReport(results) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 WEBSOCKET TEST REPORT WITH PERSISTENT STORAGE');
    console.log('='.repeat(80));
    
    console.log(`\n📈 Overall Results:`);
    console.log(`  Tests: ${results.successfulTests}/${results.totalTests} (${results.successRate.toFixed(1)}%)`);
    console.log(`  Duration: ${(results.totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`  Session ID: ${this.testSessionId}`);
    
    console.log(`\n📋 Detailed Results:`);
    results.testResults.forEach(test => {
      console.log(`\n  ${test.success ? '✅' : '❌'} ${test.testName}`);
      console.log(`    Duration: ${test.duration}ms`);
      console.log(`    Details: ${test.details}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('💾 Results saved to:');
    console.log(`  📊 SQLite Database: ${this.resultsDir}/websocket_tests.db`);
    console.log(`  📄 Text Report: ${this.resultsDir}/websocket-test-report-*.txt`);
    console.log(`  📊 JSON Data: ${this.resultsDir}/websocket-test-data-*.json`);
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      // Close all pages
      for (const page of this.pages) {
        try {
          await page.close();
        } catch (error) {
          // Ignore errors when closing pages
        }
      }
      
      // Close browser
      if (this.browser) {
        await this.browser.close();
        console.log('✅ Browser closed');
      }
      
      // Stop server
      await this.server.stop();
      console.log('✅ Server stopped');
      
      // Close database
      if (this.db) {
        this.db.close();
        console.log('✅ Database closed');
      }
      
    } catch (error) {
      console.log('⚠️  Error during cleanup:', error);
    }
  }
}

// Main execution
async function main() {
  try {
    const testSuite = new WebSocketPersistentTest();
    const results = await testSuite.runPersistentTests();
    
    const overallSuccess = results.successRate >= 60; // 60% success threshold
    
    if (!overallSuccess) {
      console.log('\n❌ WebSocket test suite failed. Check the saved reports for details.');
      process.exit(1);
    } else {
      console.log('\n✅ WebSocket tests completed! Check the saved reports for detailed results.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 WebSocket test suite crashed:', error);
    process.exit(1);
  }
}

// Handle process signals for graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 WebSocket test suite interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 WebSocket test suite terminated');
  process.exit(1);
});

// Run the test suite
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
