import { UWSBenchmarkServer } from './uws-server.js';
import { SigmaSocketsBenchmarkServer } from './sigmasockets-benchmark-server.js';
import { BenchmarkClient, type BenchmarkResult } from './benchmark-client.js';
import { BenchmarkReporter } from './benchmark-reporter.js';
import { existsSync } from 'fs';
import { join } from 'path';

interface BenchmarkConfig {
  messageCount: number;
  messageSize: number;
  concurrentClients: number;
  warmupTime: number;
}

interface BenchmarkResults {
  sigmasockets: BenchmarkResult[];
  uws: BenchmarkResult[];
  comparison: {
    sigmasocketsAvg: BenchmarkResult;
    uwsAvg: BenchmarkResult;
    performanceGain: number;
  };
}

export class BenchmarkRunner {
  private readonly SIGMASOCKETS_PORT = 8080;
  private readonly UWS_PORT = 8081;
  private reporter: BenchmarkReporter;

  constructor(private config: BenchmarkConfig) {
    this.reporter = new BenchmarkReporter();
  }

  public async runBenchmarks(): Promise<BenchmarkResults> {
    console.log('Starting SigmaSockets vs µWebSockets.js benchmark...');
    console.log(`Configuration:`, this.config);

    // Test SigmaSockets
    console.log('\n=== Testing SigmaSockets ===');
    const sigmasocketsResults = await this.testSigmaSockets();

    // Wait between tests
    await this.sleep(2000);

    // Test µWebSockets.js
    console.log('\n=== Testing µWebSockets.js ===');
    const uwsResults = await this.testUWS();

    // Calculate comparison
    const comparison = this.calculateComparison(sigmasocketsResults, uwsResults);

    // Add results to reporter
    this.addResultsToReporter(sigmasocketsResults, uwsResults);

    return {
      sigmasockets: sigmasocketsResults,
      uws: uwsResults,
      comparison
    };
  }

  private async testSigmaSockets(): Promise<BenchmarkResult[]> {
    const server = new SigmaSocketsBenchmarkServer(this.SIGMASOCKETS_PORT);
    
    try {
      await server.start();
      await this.sleep(this.config.warmupTime);

      const results: BenchmarkResult[] = [];
      
      for (let i = 0; i < this.config.concurrentClients; i++) {
        const client = new BenchmarkClient(
          `ws://localhost:${this.SIGMASOCKETS_PORT}`,
          this.config.messageCount,
          this.config.messageSize,
          true // isSigmaSocket
        );
        
        console.log(`Running SigmaSockets client ${i + 1}/${this.config.concurrentClients}`);
        const result = await client.run();
        results.push(result);
        
        // Small delay between clients
        await this.sleep(100);
      }

      const stats = server.getStats();
      console.log('SigmaSockets Server Stats:', stats);

      // Add package size information to results
      const packageSize = this.getPackageSize('server');
      if (packageSize) {
        results.forEach(result => {
          result.packageSize = packageSize;
        });
      }

      return results;
    } finally {
      await server.stop();
    }
  }

  private async testUWS(): Promise<BenchmarkResult[]> {
    const server = new UWSBenchmarkServer(this.UWS_PORT);
    
    try {
      await server.start();
      await this.sleep(this.config.warmupTime);

      const results: BenchmarkResult[] = [];
      
      for (let i = 0; i < this.config.concurrentClients; i++) {
        const client = new BenchmarkClient(
          `ws://localhost:${this.UWS_PORT}`,
          this.config.messageCount,
          this.config.messageSize,
          false // not SigmaSocket
        );
        
        console.log(`Running µWS client ${i + 1}/${this.config.concurrentClients}`);
        const result = await client.run();
        results.push(result);
        
        // Small delay between clients
        await this.sleep(100);
      }

      const stats = server.getStats();
      console.log('µWebSockets Server Stats:', stats);

      // Add package size information to results (estimate for µWebSockets)
      const packageSize = {
        bundleSize: 150000, // Estimated µWebSockets.js size
        gzippedSize: 45000, // Estimated gzipped
        dependencies: 0, // No additional deps
        totalSize: 150000
      };
      results.forEach(result => {
        result.packageSize = packageSize;
      });

      return results;
    } finally {
      server.stop();
    }
  }

  private calculateComparison(sigmasocketsResults: BenchmarkResult[], uwsResults: BenchmarkResult[]): {
    sigmasocketsAvg: BenchmarkResult;
    uwsAvg: BenchmarkResult;
    performanceGain: number;
  } {
    const sigmasocketsAvg = this.averageResults(sigmasocketsResults);
    const uwsAvg = this.averageResults(uwsResults);
    
    const performanceGain = ((sigmasocketsAvg.messagesPerSecond - uwsAvg.messagesPerSecond) / uwsAvg.messagesPerSecond) * 100;

    return {
      sigmasocketsAvg,
      uwsAvg,
      performanceGain
    };
  }

  private averageResults(results: BenchmarkResult[]): BenchmarkResult {
    const count = results.length;
    
    return {
      totalMessages: results.reduce((sum, r) => sum + r.totalMessages, 0) / count,
      duration: results.reduce((sum, r) => sum + r.duration, 0) / count,
      messagesPerSecond: results.reduce((sum, r) => sum + r.messagesPerSecond, 0) / count,
      averageLatency: results.reduce((sum, r) => sum + r.averageLatency, 0) / count,
      minLatency: Math.min(...results.map(r => r.minLatency)),
      maxLatency: Math.max(...results.map(r => r.maxLatency)),
      errors: results.reduce((sum, r) => sum + r.errors, 0)
    };
  }

  private addResultsToReporter(sigmasocketsResults: BenchmarkResult[], uwsResults: BenchmarkResult[]): void {
    // Add SigmaSockets results
    const sigmasocketsAvg = this.averageResults(sigmasocketsResults);
    this.reporter.addResult({
      name: 'SigmaSockets',
      messagesPerSecond: sigmasocketsAvg.messagesPerSecond,
      averageLatency: sigmasocketsAvg.averageLatency,
      totalMessages: sigmasocketsAvg.totalMessages,
      totalTime: sigmasocketsAvg.duration,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
      concurrentClients: this.config.concurrentClients,
      messageSize: this.config.messageSize,
    });

    // Add µWebSockets results
    const uwsAvg = this.averageResults(uwsResults);
    this.reporter.addResult({
      name: 'µWebSockets.js',
      messagesPerSecond: uwsAvg.messagesPerSecond,
      averageLatency: uwsAvg.averageLatency,
      totalMessages: uwsAvg.totalMessages,
      totalTime: uwsAvg.duration,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
      concurrentClients: this.config.concurrentClients,
      messageSize: this.config.messageSize,
    });
  }

  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return usage.heapUsed;
  }

  private getCPUUsage(): number {
    // Simplified CPU usage calculation
    const usage = process.cpuUsage();
    return (usage.user + usage.system) / 1000000; // Convert to seconds
  }

  private getPackageSize(packageName: string): { bundleSize: number; gzippedSize: number; dependencies: number; totalSize: number } | undefined {
    try {
      // Try to get package size from dist directory
      const distPath = join(process.cwd(), '..', '..', 'packages', packageName, 'dist');
      if (!existsSync(distPath)) return undefined;

      let bundleSize = 0;
      let gzippedSize = 0;
      let dependencies = 0;

      // Calculate bundle size from dist files
      const { execSync } = require('child_process');
      try {
        const bundleSizeOutput = execSync(`find "${distPath}" -name "*.js" -exec wc -c {} + | tail -1`, { encoding: 'utf8' });
        bundleSize = parseInt(bundleSizeOutput.trim().split(' ')[0]) || 0;
      } catch (e) {
        // Fallback: estimate from known sizes
        if (packageName === 'client') bundleSize = 22849; // Known size from build
        if (packageName === 'server') bundleSize = 44652; // Known size from build
      }

      // Estimate gzipped size (typically 20-30% of original)
      gzippedSize = Math.round(bundleSize * 0.25);

      // Estimate dependencies size
      if (packageName === 'client') dependencies = 0; // No external deps
      if (packageName === 'server') dependencies = 50000; // ws, flatbuffers, etc.

      const totalSize = bundleSize + dependencies;

      return { bundleSize, gzippedSize, dependencies, totalSize };
    } catch (error) {
      console.warn(`Could not determine package size for ${packageName}:`, error);
      return undefined;
    }
  }

  public generateReport(outputPath: string): void {
    this.reporter.generateMarkdownReport(outputPath);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run benchmark if this file is executed directly
if (require.main === module) {
  const config: BenchmarkConfig = {
    messageCount: 1000,
    messageSize: 1024, // 1KB messages
    concurrentClients: 5,
    warmupTime: 1000
  };

  const runner = new BenchmarkRunner(config);
  
  runner.runBenchmarks()
    .then((results) => {
      console.log('\n=== BENCHMARK RESULTS ===');
      console.log('\nSigmaSockets Average:');
      console.log(`  Messages/sec: ${results.comparison.sigmasocketsAvg.messagesPerSecond.toFixed(2)}`);
      console.log(`  Avg Latency: ${results.comparison.sigmasocketsAvg.averageLatency.toFixed(2)}ms`);
      console.log(`  Errors: ${results.comparison.sigmasocketsAvg.errors}`);
      
      console.log('\nµWebSockets.js Average:');
      console.log(`  Messages/sec: ${results.comparison.uwsAvg.messagesPerSecond.toFixed(2)}`);
      console.log(`  Avg Latency: ${results.comparison.uwsAvg.averageLatency.toFixed(2)}ms`);
      console.log(`  Errors: ${results.comparison.uwsAvg.errors}`);
      
      console.log(`\nPerformance Gain: ${results.comparison.performanceGain.toFixed(2)}%`);
      
      if (results.comparison.performanceGain > 0) {
        console.log('🎉 SigmaSockets outperforms µWebSockets.js!');
      } else {
        console.log('⚠️  µWebSockets.js performs better in this test');
      }

      // Generate markdown report
      const reportPath = `benchmark-report-${new Date().toISOString().split('T')[0]}.md`;
      runner.generateReport(reportPath);
      console.log(`\n📊 Detailed report generated: ${reportPath}`);
    })
    .catch((error) => {
      console.error('Benchmark failed:', error);
      process.exit(1);
    });
}

