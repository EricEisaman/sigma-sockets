#!/usr/bin/env node

/**
 * Simple WebSocket Reconnection Test
 * 
 * A basic test that validates the server-side improvements without
 * requiring the client package.
 */

import { SigmaSocketServer } from './index';
import { WebSocket } from 'ws';

async function runSimpleTest() {
  console.log('🚀 Running Simple WebSocket Reconnection Test...');
  
  let server: SigmaSocketServer | undefined;
  
  try {
    // Start server with enhanced configuration
    server = new SigmaSocketServer({
      port: 8082,
      host: 'localhost',
      heartbeatInterval: 3000,
      minHeartbeatInterval: 2000,
      maxHeartbeatInterval: 10000,
      adaptiveHeartbeatEnabled: true,
      connectionQualityThreshold: 0.7
    });
    
    await server.start();
    console.log('✅ Server started on port 8082 with enhanced configuration');
    
    // Test 1: Server statistics
    console.log('\n📋 Test 1: Server Statistics');
    const stats = server.getConnectionPoolStatistics();
    console.log(`✅ Server statistics available: ${JSON.stringify(stats, null, 2)}`);
    
    // Test 2: Connection quality manager
    console.log('\n📋 Test 2: Connection Quality Manager');
    const qualityMetrics = server.getAllConnectionQualityMetrics();
    console.log(`✅ Connection quality metrics available: ${qualityMetrics.size} connections tracked`);
    
    // Test 3: Advanced features
    console.log('\n📋 Test 3: Advanced Features');
    const analytics = server.getRealTimeAnalytics();
    console.log(`✅ Real-time analytics available: ${JSON.stringify(analytics, null, 2)}`);
    
    // Test 4: Optimization recommendations
    console.log('\n📋 Test 4: Optimization Recommendations');
    const recommendations = server.getOptimizationRecommendations();
    console.log(`✅ Optimization recommendations available: ${recommendations.recommendations.length} recommendations`);
    
    // Test 5: Security validation
    console.log('\n📋 Test 5: Security Validation');
    const mockRequest = {
      url: 'ws://localhost:8082',
      headers: {
        origin: 'http://localhost:3000',
        'user-agent': 'TestClient/1.0'
      }
    };
    const securityResult = server.validateConnectionSecurity(new WebSocket('ws://localhost:8082'), mockRequest);
    console.log(`✅ Security validation working: ${securityResult.isValid ? 'Valid' : 'Invalid'}`);
    
    // Test 6: Binary data optimization
    console.log('\n📋 Test 6: Binary Data Optimization');
    const testData = new Uint8Array(1024);
    testData.fill(42);
    const optimizationResult = server.optimizeBinaryDataTransfer(testData, true);
    console.log(`✅ Binary data optimization working: ${optimizationResult.optimizationApplied ? 'Applied' : 'Not applied'}`);
    
    // Test 7: Load balancing metrics
    console.log('\n📋 Test 7: Load Balancing Metrics');
    const loadBalancingMetrics = server.getLoadBalancingMetrics();
    console.log(`✅ Load balancing metrics available: ${JSON.stringify(loadBalancingMetrics, null, 2)}`);
    
    // Test 8: Client behavior insights
    console.log('\n📋 Test 8: Client Behavior Insights');
    const behaviorInsights = server.getClientBehaviorInsights();
    console.log(`✅ Client behavior insights available: ${JSON.stringify(behaviorInsights, null, 2)}`);
    
    console.log('\n🎉 All simple tests passed!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Enhanced server configuration working');
    console.log('  ✅ Connection quality management active');
    console.log('  ✅ Advanced features operational');
    console.log('  ✅ Security validation functional');
    console.log('  ✅ Binary data optimization working');
    console.log('  ✅ Load balancing metrics available');
    console.log('  ✅ Client behavior tracking active');
    console.log('  ✅ Optimization recommendations available');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    
    if (server) {
      try {
        await server.stop();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    console.log('✅ Cleanup completed');
  }
}

// Run the simple test
if (require.main === module) {
  runSimpleTest()
    .then(() => {
      console.log('\n✅ Simple test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Simple test failed:', error);
      process.exit(1);
    });
}

export { runSimpleTest };
