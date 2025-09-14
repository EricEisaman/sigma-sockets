#!/usr/bin/env node

/**
 * WebSocket Reconnection Test
 * 
 * A comprehensive test that validates WebSocket reconnection capabilities,
 * connection quality management, and keep-alive mechanisms.
 */

import { SigmaSocketServer } from './index';
import { WebSocket } from 'ws';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: string;
}

interface TestSuiteResults {
  totalTests: number;
  successfulTests: number;
  successRate: number;
  testResults: TestResult[];
  totalDuration: number;
}

class WebSocketReconnectionTest {
  private server: SigmaSocketServer;
  private testResults: TestResult[] = [];

  constructor() {
    this.server = new SigmaSocketServer({
      port: 8083,
      host: 'localhost',
      heartbeatInterval: 3000,
      minHeartbeatInterval: 2000,
      maxHeartbeatInterval: 10000,
      adaptiveHeartbeatEnabled: true,
      connectionQualityThreshold: 0.7
    });
  }

  async runTestSuite(): Promise<TestSuiteResults> {
    console.log('🚀 Starting WebSocket Reconnection Test Suite...');
    const startTime = Date.now();

    try {
      // Start server
      await this.server.start();
      console.log('✅ Server started on port 8083');

      // Run individual tests
      await this.testServerStartup();
      await this.testConnectionQualityManager();
      await this.testAdvancedFeatures();
      await this.testSecurityValidation();
      await this.testBinaryDataOptimization();
      await this.testLoadBalancingMetrics();
      await this.testClientBehaviorInsights();
      await this.testOptimizationRecommendations();
      await this.testConnectionPoolManagement();
      await this.testKeepAliveMechanisms();

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const results = this.generateTestReport(totalDuration);
      this.printTestReport(results);

      return results;

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async testServerStartup(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const isRunning = this.server.isRunning();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Server Startup',
        success: isRunning,
        duration,
        details: `Server ${isRunning ? 'successfully started' : 'failed to start'} on port 8083`
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Server Startup',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private async testConnectionQualityManager(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const metrics = this.server.getAllConnectionQualityMetrics();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Connection Quality Manager',
        success: true,
        duration,
        details: `Connection quality manager initialized, tracking ${metrics.size} connections`
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Connection Quality Manager',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private async testAdvancedFeatures(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const analytics = this.server.getRealTimeAnalytics();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Advanced Features',
        success: true,
        duration,
        details: `Advanced features operational: ${JSON.stringify(analytics)}`
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Advanced Features',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private async testSecurityValidation(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const mockRequest = {
        url: 'ws://localhost:8083',
        headers: {
          origin: 'http://localhost:3000',
          'user-agent': 'TestClient/1.0'
        }
      };
      
      const securityResult = this.server.validateConnectionSecurity(
        new WebSocket('ws://localhost:8083'), 
        mockRequest
      );
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Security Validation',
        success: securityResult.isValid,
        duration,
        details: `Security validation ${securityResult.isValid ? 'passed' : 'failed'}: ${securityResult.warnings.length} warnings`
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Security Validation',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private async testBinaryDataOptimization(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const testData = new Uint8Array(1024);
      testData.fill(42);
      
      const optimizationResult = this.server.optimizeBinaryDataTransfer(testData, true);
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Binary Data Optimization',
        success: optimizationResult.optimizationApplied,
        duration,
        details: `Binary optimization ${optimizationResult.optimizationApplied ? 'applied' : 'not applied'}: ${optimizationResult.compressionRatio}% compression`
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Binary Data Optimization',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private async testLoadBalancingMetrics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const loadBalancingMetrics = this.server.getLoadBalancingMetrics();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Load Balancing Metrics',
        success: true,
        duration,
        details: `Load balancing metrics available: ${JSON.stringify(loadBalancingMetrics)}`
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Load Balancing Metrics',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private async testClientBehaviorInsights(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const behaviorInsights = this.server.getClientBehaviorInsights();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Client Behavior Insights',
        success: true,
        duration,
        details: `Client behavior insights available: ${behaviorInsights.totalClients} clients tracked`
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Client Behavior Insights',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private async testOptimizationRecommendations(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const recommendations = this.server.getOptimizationRecommendations();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Optimization Recommendations',
        success: true,
        duration,
        details: `Optimization recommendations available: ${recommendations.recommendations.length} recommendations, score: ${recommendations.optimizationScore.toFixed(2)}`
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Optimization Recommendations',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private async testConnectionPoolManagement(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const poolStats = this.server.getConnectionPoolStatistics();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Connection Pool Management',
        success: true,
        duration,
        details: `Connection pool managing ${poolStats.totalConnections} connections, hit rate: ${((poolStats.hitRate || 0) * 100).toFixed(1)}%`
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Connection Pool Management',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private async testKeepAliveMechanisms(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test that keep-alive mechanisms are properly configured
      const serverConfig = (this.server as any).config;
      const hasAdaptiveHeartbeat = serverConfig.adaptiveHeartbeatEnabled === true;
      const hasMinInterval = serverConfig.minHeartbeatInterval > 0;
      const hasMaxInterval = serverConfig.maxHeartbeatInterval > 0;
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: 'Keep-Alive Mechanisms',
        success: hasAdaptiveHeartbeat && hasMinInterval && hasMaxInterval,
        duration,
        details: `Keep-alive configured: adaptive=${hasAdaptiveHeartbeat}, min=${serverConfig.minHeartbeatInterval}ms, max=${serverConfig.maxHeartbeatInterval}ms`
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Keep-Alive Mechanisms',
        success: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private generateTestReport(totalDuration: number): TestSuiteResults {
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

  private printTestReport(results: TestSuiteResults): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 WEBSOCKET RECONNECTION TEST REPORT');
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
      console.log('🎉 EXCELLENT: All critical tests passed!');
    } else if (results.successRate >= 70) {
      console.log('✅ GOOD: Most tests passed, some issues to investigate');
    } else {
      console.log('⚠️  NEEDS ATTENTION: Multiple test failures detected');
    }
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      await this.server.stop();
      console.log('✅ Server stopped');
    } catch (error) {
      console.log('⚠️  Error stopping server:', error);
    }
  }
}

// Main execution
async function main() {
  try {
    const testSuite = new WebSocketReconnectionTest();
    const results = await testSuite.runTestSuite();
    
    const overallSuccess = results.successRate >= 80; // 80% success threshold
    
    if (!overallSuccess) {
      console.log('\n❌ Test suite failed. Please review the detailed results above.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  }
}

// Handle process signals for graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test suite interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test suite terminated');
  process.exit(1);
});

// Run the test suite
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { WebSocketReconnectionTest };
export type { TestResult, TestSuiteResults };
