import { BenchmarkReporter } from './benchmark-reporter.js';

// Simple benchmark demo that generates a markdown report
async function runSimpleBenchmarkDemo() {
  console.log('🚀 Running Simple Benchmark Demo...');
  
  const reporter = new BenchmarkReporter();
  
  // Simulate benchmark results
  const mockResults = [
    {
      name: 'SigmaSockets',
      messagesPerSecond: 125000,
      averageLatency: 0.8,
      totalMessages: 10000,
      totalTime: 0.08,
      memoryUsage: 45 * 1024 * 1024, // 45MB
      cpuUsage: 12.5,
      concurrentClients: 10,
      messageSize: 1024,
    },
    {
      name: 'Node.js WebSocket',
      messagesPerSecond: 85000,
      averageLatency: 1.2,
      totalMessages: 10000,
      totalTime: 0.12,
      memoryUsage: 38 * 1024 * 1024, // 38MB
      cpuUsage: 15.8,
      concurrentClients: 10,
      messageSize: 1024,
    },
    {
      name: 'Socket.IO',
      messagesPerSecond: 45000,
      averageLatency: 2.1,
      totalMessages: 10000,
      totalTime: 0.22,
      memoryUsage: 52 * 1024 * 1024, // 52MB
      cpuUsage: 18.2,
      concurrentClients: 10,
      messageSize: 1024,
    }
  ];
  
  // Add results to reporter
  mockResults.forEach(result => {
    reporter.addResult(result);
  });
  
  // Generate markdown report
  const reportPath = `benchmark-demo-report-${new Date().toISOString().split('T')[0]}.md`;
  reporter.generateMarkdownReport(reportPath);
  
  console.log('✅ Benchmark demo completed!');
  console.log(`📊 Report generated: ${reportPath}`);
  
  // Display summary
  console.log('\n=== BENCHMARK SUMMARY ===');
  mockResults.forEach(result => {
    console.log(`${result.name}:`);
    console.log(`  Messages/sec: ${result.messagesPerSecond.toLocaleString()}`);
    console.log(`  Avg Latency: ${result.averageLatency.toFixed(2)}ms`);
    console.log(`  Memory: ${(result.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
    console.log('');
  });
}

// Run the demo
runSimpleBenchmarkDemo().catch(console.error);
