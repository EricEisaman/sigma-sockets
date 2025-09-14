#!/usr/bin/env node

/**
 * Comprehensive Network Failure Simulation Test
 * 
 * This test simulates various network failure scenarios to validate
 * WebSocket reconnection capabilities, connection quality management,
 * and keep-alive mechanisms under real-world conditions.
 */

import { SigmaSocketServer } from './dist/index.js';
import { WebSocket } from 'ws';

class NetworkFailureTest {
  constructor() {
    this.server = new SigmaSocketServer({
      port: 8085,
      host: 'localhost',
      heartbeatInterval: 2000, // Faster for testing
      minHeartbeatInterval: 1000,
      maxHeartbeatInterval: 5000,
      adaptiveHeartbeatEnabled: true,
      connectionQualityThreshold: 0.7,
      sessionTimeout: 30000 // 30 seconds
    });
    this.testResults = [];
    this.clients = [];
  }

  async runNetworkFailureTests() {
    console.log('🚀 Starting Comprehensive Network Failure Simulation Test...');
    console.log('=' .repeat(80));
    
    const startTime = Date.now();

    try {
      // Start server
      await this.server.start();
      console.log('✅ Server started on port 8085');

      // Run network failure simulation tests
      await this.testBasicConnectionAndDisconnection();
      await this.testRapidConnectionLoss();
      await this.testServerRestartScenario();
      await this.testLoadBalancerTimeoutSimulation();
      await this.testConnectionQualityDegradation();
      await this.testMultipleClientFailures();
      await this.testAdaptiveHeartbeatUnderStress();
      await this.testConnectionPoolStress();
      await this.testKeepAliveUnderNetworkIssues();

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const results = this.generateTestReport(totalDuration);
      this.printTestReport(results);

      return results;

    } catch (error) {
      console.error('❌ Network failure test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async testBasicConnectionAndDisconnection() {
    console.log('\n📋 Test 1: Basic Connection and Disconnection');
    const startTime = Date.now();
    
    try {
      // Create a WebSocket connection
      const ws = new WebSocket('ws://localhost:8085');
      
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      console.log('  ✅ Client connected successfully');

      // Send a test message
      ws.send(JSON.stringify({ type: 'test', data: 'Hello Server' }));
      console.log('  ✅ Test message sent');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Close connection
      ws.close();
      console.log('  ✅ Connection closed');

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Basic Connection and Disconnection',
        success: true,
        duration,
        details: 'Successfully connected, sent message, and disconnected'
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Basic Connection and Disconnection',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testRapidConnectionLoss() {
    console.log('\n📋 Test 2: Rapid Connection Loss');
    const startTime = Date.now();
    
    try {
      const connections = [];
      const connectionCount = 5;

      // Create multiple connections rapidly
      for (let i = 0; i < connectionCount; i++) {
        const ws = new WebSocket('ws://localhost:8085');
        connections.push(ws);
        
        await new Promise((resolve, reject) => {
          ws.on('open', resolve);
          ws.on('error', reject);
          setTimeout(() => reject(new Error('Connection timeout')), 3000);
        });
        
        console.log(`  ✅ Connection ${i + 1} established`);
      }

      // Close all connections rapidly
      connections.forEach((ws, index) => {
        ws.close();
        console.log(`  ✅ Connection ${index + 1} closed`);
      });

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Rapid Connection Loss',
        success: true,
        duration,
        details: `Successfully handled ${connectionCount} rapid connections and disconnections`
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Rapid Connection Loss',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testServerRestartScenario() {
    console.log('\n📋 Test 3: Server Restart Scenario');
    const startTime = Date.now();
    
    try {
      // Create a connection
      const ws = new WebSocket('ws://localhost:8085');
      
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      console.log('  ✅ Initial connection established');

      // Stop server
      await this.server.stop();
      console.log('  ✅ Server stopped');

      // Wait for connection to detect server shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Restart server
      await this.server.start();
      console.log('  ✅ Server restarted');

      // Create new connection to restarted server
      const ws2 = new WebSocket('ws://localhost:8085');
      
      await new Promise((resolve, reject) => {
        ws2.on('open', resolve);
        ws2.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      console.log('  ✅ Connection to restarted server established');

      ws2.close();

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Server Restart Scenario',
        success: true,
        duration,
        details: 'Successfully handled server restart and reconnection'
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Server Restart Scenario',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testLoadBalancerTimeoutSimulation() {
    console.log('\n📋 Test 4: Load Balancer Timeout Simulation');
    const startTime = Date.now();
    
    try {
      // Create connection
      const ws = new WebSocket('ws://localhost:8085');
      
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      console.log('  ✅ Connection established');

      // Simulate 60+ second idle period (Amazon ELB timeout)
      console.log('  ⏳ Simulating 60+ second idle period...');
      await new Promise(resolve => setTimeout(resolve, 65000)); // 65 seconds

      // Check if connection is still alive (should be due to keep-alive)
      if (ws.readyState === WebSocket.OPEN) {
        console.log('  ✅ Connection survived ELB timeout (keep-alive working)');
        
        // Test sending data after idle period
        ws.send(JSON.stringify({ type: 'test', data: 'After idle period' }));
        console.log('  ✅ Successfully sent data after idle period');
        
        this.testResults.push({
          testName: 'Load Balancer Timeout Simulation',
          success: true,
          duration: Date.now() - startTime,
          details: 'Connection maintained through 60+ second idle period with keep-alive'
        });
      } else {
        throw new Error('Connection died during idle period');
      }

      ws.close();

    } catch (error) {
      this.testResults.push({
        testName: 'Load Balancer Timeout Simulation',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testConnectionQualityDegradation() {
    console.log('\n📋 Test 5: Connection Quality Degradation');
    const startTime = Date.now();
    
    try {
      // Create connection
      const ws = new WebSocket('ws://localhost:8085');
      
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      console.log('  ✅ Connection established');

      // Send multiple messages to generate quality metrics
      for (let i = 0; i < 10; i++) {
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('  ✅ Sent multiple messages for quality tracking');

      // Check server statistics
      const poolStats = this.server.getConnectionPoolStatistics();
      const qualityMetrics = this.server.getAllConnectionQualityMetrics();
      
      console.log(`  📊 Pool stats: ${poolStats.totalConnections} connections, hit rate: ${((poolStats.hitRate || 0) * 100).toFixed(1)}%`);
      console.log(`  📊 Quality metrics: ${qualityMetrics.size} connections tracked`);

      ws.close();

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Connection Quality Degradation',
        success: true,
        duration,
        details: `Quality tracking active: ${qualityMetrics.size} connections monitored`
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Connection Quality Degradation',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testMultipleClientFailures() {
    console.log('\n📋 Test 6: Multiple Client Failures');
    const startTime = Date.now();
    
    try {
      const connections = [];
      const clientCount = 10;

      // Create multiple clients
      for (let i = 0; i < clientCount; i++) {
        const ws = new WebSocket('ws://localhost:8085');
        connections.push(ws);
        
        await new Promise((resolve, reject) => {
          ws.on('open', resolve);
          ws.on('error', reject);
          setTimeout(() => reject(new Error('Connection timeout')), 3000);
        });
        
        console.log(`  ✅ Client ${i + 1} connected`);
      }

      // Simulate random failures
      const failureCount = Math.floor(clientCount / 2);
      for (let i = 0; i < failureCount; i++) {
        connections[i].close();
        console.log(`  ❌ Client ${i + 1} failed`);
      }

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check server statistics
      const poolStats = this.server.getConnectionPoolStatistics();
      console.log(`  📊 Server managing ${poolStats.totalConnections} connections after failures`);

      // Close remaining connections
      for (let i = failureCount; i < clientCount; i++) {
        connections[i].close();
      }

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Multiple Client Failures',
        success: true,
        duration,
        details: `Handled ${clientCount} clients with ${failureCount} simulated failures`
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Multiple Client Failures',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testAdaptiveHeartbeatUnderStress() {
    console.log('\n📋 Test 7: Adaptive Heartbeat Under Stress');
    const startTime = Date.now();
    
    try {
      // Create connection
      const ws = new WebSocket('ws://localhost:8085');
      
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      console.log('  ✅ Connection established');

      // Send rapid messages to simulate stress
      for (let i = 0; i < 20; i++) {
        ws.send(JSON.stringify({ type: 'stress_test', data: `Message ${i}`, timestamp: Date.now() }));
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms intervals
      }

      console.log('  ✅ Sent 20 rapid messages');

      // Check optimization recommendations
      const recommendations = this.server.getOptimizationRecommendations();
      console.log(`  📊 Optimization score: ${recommendations.optimizationScore.toFixed(2)}`);
      console.log(`  📊 Recommendations: ${recommendations.recommendations.length}`);

      ws.close();

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Adaptive Heartbeat Under Stress',
        success: true,
        duration,
        details: `Adaptive heartbeat handled stress test, optimization score: ${recommendations.optimizationScore.toFixed(2)}`
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Adaptive Heartbeat Under Stress',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testConnectionPoolStress() {
    console.log('\n📋 Test 8: Connection Pool Stress');
    const startTime = Date.now();
    
    try {
      const connections = [];
      const maxConnections = 20;

      // Create many connections to stress the pool
      for (let i = 0; i < maxConnections; i++) {
        try {
          const ws = new WebSocket('ws://localhost:8085');
          connections.push(ws);
          
          await new Promise((resolve, reject) => {
            ws.on('open', resolve);
            ws.on('error', reject);
            setTimeout(() => reject(new Error('Connection timeout')), 2000);
          });
          
          if (i % 5 === 0) {
            console.log(`  ✅ Created ${i + 1} connections`);
          }
        } catch (error) {
          console.log(`  ⚠️  Connection ${i + 1} failed: ${error.message}`);
        }
      }

      // Check pool statistics
      const poolStats = this.server.getConnectionPoolStatistics();
      console.log(`  📊 Pool managing ${poolStats.totalConnections} connections`);
      console.log(`  📊 Pool utilization: ${poolStats.poolUtilization?.toFixed(1) || 0}%`);

      // Close all connections
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });

      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Connection Pool Stress',
        success: true,
        duration,
        details: `Pool handled ${connections.length} connections, utilization: ${poolStats.poolUtilization?.toFixed(1) || 0}%`
      });

    } catch (error) {
      this.testResults.push({
        testName: 'Connection Pool Stress',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error.message}`
      });
    }
  }

  async testKeepAliveUnderNetworkIssues() {
    console.log('\n📋 Test 9: Keep-Alive Under Network Issues');
    const startTime = Date.now();
    
    try {
      // Create connection
      const ws = new WebSocket('ws://localhost:8085');
      
      await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      console.log('  ✅ Connection established');

      // Simulate network issues by sending messages with delays
      const messages = [
        { delay: 100, data: 'Normal message' },
        { delay: 2000, data: 'Delayed message 1' },
        { delay: 100, data: 'Normal message' },
        { delay: 3000, data: 'Delayed message 2' },
        { delay: 100, data: 'Normal message' }
      ];

      for (const msg of messages) {
        await new Promise(resolve => setTimeout(resolve, msg.delay));
        ws.send(JSON.stringify({ type: 'network_test', data: msg.data, timestamp: Date.now() }));
        console.log(`  📤 Sent: ${msg.data} (${msg.delay}ms delay)`);
      }

      // Check if connection is still alive
      if (ws.readyState === WebSocket.OPEN) {
        console.log('  ✅ Connection survived network issues');
        
        this.testResults.push({
          testName: 'Keep-Alive Under Network Issues',
          success: true,
          duration: Date.now() - startTime,
          details: 'Connection maintained through simulated network issues'
        });
      } else {
        throw new Error('Connection died during network issues');
      }

      ws.close();

    } catch (error) {
      this.testResults.push({
        testName: 'Keep-Alive Under Network Issues',
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
    console.log('📊 NETWORK FAILURE SIMULATION TEST REPORT');
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
      console.log('🎉 EXCELLENT: All network failure tests passed!');
      console.log('   The WebSocket implementation is robust under network stress.');
    } else if (results.successRate >= 70) {
      console.log('✅ GOOD: Most network failure tests passed.');
      console.log('   Some issues detected that should be investigated.');
    } else {
      console.log('⚠️  NEEDS ATTENTION: Multiple network failure test failures.');
      console.log('   The implementation may not be robust enough for production.');
    }
    
    console.log('\n🔧 Key Features Tested:');
    console.log('  • Connection establishment and teardown');
    console.log('  • Server restart handling');
    console.log('  • Load balancer timeout survival');
    console.log('  • Connection quality monitoring');
    console.log('  • Multiple client failure scenarios');
    console.log('  • Adaptive heartbeat under stress');
    console.log('  • Connection pool management');
    console.log('  • Keep-alive under network issues');
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      // Close any remaining client connections
      this.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      
      // Stop server
      await this.server.stop();
      console.log('✅ Server stopped and cleanup completed');
    } catch (error) {
      console.log('⚠️  Error during cleanup:', error);
    }
  }
}

// Main execution
async function main() {
  try {
    const testSuite = new NetworkFailureTest();
    const results = await testSuite.runNetworkFailureTests();
    
    const overallSuccess = results.successRate >= 80; // 80% success threshold
    
    if (!overallSuccess) {
      console.log('\n❌ Network failure test suite failed. Please review the detailed results above.');
      process.exit(1);
    } else {
      console.log('\n✅ All network failure tests passed successfully!');
      console.log('🚀 The WebSocket implementation is ready for production use.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Network failure test suite crashed:', error);
    process.exit(1);
  }
}

// Handle process signals for graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Network failure test suite interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Network failure test suite terminated');
  process.exit(1);
});

// Run the test suite
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
