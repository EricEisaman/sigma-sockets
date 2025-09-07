import { SigmaSocketsBenchmarkServer } from './sigmasockets-benchmark-server.js';
import { BenchmarkClient, type BenchmarkResult } from './benchmark-client.js';
import WebSocket, { WebSocketServer } from 'ws';
// import * as flatbuffers from 'flatbuffers';
// import { Message } from './generated/sigma-sockets/message';
// import { MessageType } from './generated/sigma-sockets/message-type';
// import { MessageData } from './generated/sigma-sockets/message-data';
// import { DataMessage } from './generated/sigma-sockets/data-message';

// Simple WebSocket server for comparison
class SimpleWSServer {
  private wss: WebSocketServer;
  private messageCount = 0;
  private startTime = 0;

  constructor(private port: number) {
    this.wss = new WebSocketServer({ 
      port: this.port,
      perMessageDeflate: false // Disable compression for fair comparison
    });
    this.setupServer();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Simple WS Client connected');
      
      ws.on('message', (data: Buffer) => {
        try {
          // Echo the message back
          ws.send(data);
          this.messageCount++;
        } catch (error) {
          console.error('Simple WS Message error:', error);
        }
      });

      ws.on('close', () => {
        console.log('Simple WS Client disconnected');
      });

      ws.on('error', (error) => {
        console.error('Simple WS Error:', error);
      });
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.startTime = Date.now();
      console.log(`Simple WebSocket server listening on port ${this.port}`);
      resolve();
    });
  }

  public stop(): void {
    this.wss.close();
  }

  public getStats() {
    const uptime = Date.now() - this.startTime;
    return {
      connectedClients: this.wss.clients.size,
      totalMessages: this.messageCount,
      messagesPerSecond: this.messageCount / (uptime / 1000),
      uptime
    };
  }
}

interface SimpleBenchmarkResults {
  sigmasockets: BenchmarkResult[];
  simpleWS: BenchmarkResult[];
  comparison: {
    sigmasocketsAvg: BenchmarkResult;
    simpleWSAvg: BenchmarkResult;
    performanceGain: number;
  };
}

class SimpleBenchmarkRunner {
  private readonly SIGMASOCKETS_PORT = 8080;
  private readonly SIMPLE_WS_PORT = 8082;

  constructor(
    private messageCount: number = 500,
    private messageSize: number = 1024,
    private concurrentClients: number = 3
  ) {}

  public async runBenchmarks(): Promise<SimpleBenchmarkResults> {
    console.log('Starting SigmaSockets vs Simple WebSocket benchmark...');
    console.log(`Messages: ${this.messageCount}, Size: ${this.messageSize}B, Clients: ${this.concurrentClients}`);

    // Test SigmaSockets
    console.log('\n=== Testing SigmaSockets ===');
    const sigmasocketsResults = await this.testSigmaSockets();

    // Wait between tests
    await this.sleep(2000);

    // Test Simple WebSocket
    console.log('\n=== Testing Simple WebSocket ===');
    const simpleWSResults = await this.testSimpleWS();

    // Calculate comparison
    const comparison = this.calculateComparison(sigmasocketsResults, simpleWSResults);

    return {
      sigmasockets: sigmasocketsResults,
      simpleWS: simpleWSResults,
      comparison
    };
  }

  private async testSigmaSockets(): Promise<BenchmarkResult[]> {
    const server = new SigmaSocketsBenchmarkServer(this.SIGMASOCKETS_PORT);
    
    try {
      await server.start();
      await this.sleep(1000); // Warmup

      const results: BenchmarkResult[] = [];
      
      for (let i = 0; i < this.concurrentClients; i++) {
        const client = new BenchmarkClient(
          `ws://localhost:${this.SIGMASOCKETS_PORT}`,
          this.messageCount,
          this.messageSize,
          true // isSigmaSocket
        );
        
        console.log(`Running SigmaSockets client ${i + 1}/${this.concurrentClients}`);
        const result = await client.run();
        results.push(result);
        
        await this.sleep(100);
      }

      const stats = server.getStats();
      console.log('SigmaSockets Server Stats:', stats);

      return results;
    } finally {
      await server.stop();
    }
  }

  private async testSimpleWS(): Promise<BenchmarkResult[]> {
    const server = new SimpleWSServer(this.SIMPLE_WS_PORT);
    
    try {
      await server.start();
      await this.sleep(1000); // Warmup

      const results: BenchmarkResult[] = [];
      
      for (let i = 0; i < this.concurrentClients; i++) {
        const client = new BenchmarkClient(
          `ws://localhost:${this.SIMPLE_WS_PORT}`,
          this.messageCount,
          this.messageSize,
          false // not SigmaSocket
        );
        
        console.log(`Running Simple WS client ${i + 1}/${this.concurrentClients}`);
        const result = await client.run();
        results.push(result);
        
        await this.sleep(100);
      }

      const stats = server.getStats();
      console.log('Simple WebSocket Server Stats:', stats);

      return results;
    } finally {
      server.stop();
    }
  }

  private calculateComparison(sigmasocketsResults: BenchmarkResult[], simpleWSResults: BenchmarkResult[]): {
    sigmasocketsAvg: BenchmarkResult;
    simpleWSAvg: BenchmarkResult;
    performanceGain: number;
  } {
    const sigmasocketsAvg = this.averageResults(sigmasocketsResults);
    const simpleWSAvg = this.averageResults(simpleWSResults);
    
    const performanceGain = ((sigmasocketsAvg.messagesPerSecond - simpleWSAvg.messagesPerSecond) / simpleWSAvg.messagesPerSecond) * 100;

    return {
      sigmasocketsAvg,
      simpleWSAvg,
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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run benchmark if this file is executed directly
if (require.main === module) {
  const runner = new SimpleBenchmarkRunner(500, 1024, 3);
  
  runner.runBenchmarks()
    .then((results) => {
      console.log('\n=== BENCHMARK RESULTS ===');
      console.log('\nSigmaSockets Average:');
      console.log(`  Messages/sec: ${results.comparison.sigmasocketsAvg.messagesPerSecond.toFixed(2)}`);
      console.log(`  Avg Latency: ${results.comparison.sigmasocketsAvg.averageLatency.toFixed(2)}ms`);
      console.log(`  Min Latency: ${results.comparison.sigmasocketsAvg.minLatency.toFixed(2)}ms`);
      console.log(`  Max Latency: ${results.comparison.sigmasocketsAvg.maxLatency.toFixed(2)}ms`);
      console.log(`  Errors: ${results.comparison.sigmasocketsAvg.errors}`);
      
      console.log('\nSimple WebSocket Average:');
      console.log(`  Messages/sec: ${results.comparison.simpleWSAvg.messagesPerSecond.toFixed(2)}`);
      console.log(`  Avg Latency: ${results.comparison.simpleWSAvg.averageLatency.toFixed(2)}ms`);
      console.log(`  Min Latency: ${results.comparison.simpleWSAvg.minLatency.toFixed(2)}ms`);
      console.log(`  Max Latency: ${results.comparison.simpleWSAvg.maxLatency.toFixed(2)}ms`);
      console.log(`  Errors: ${results.comparison.simpleWSAvg.errors}`);
      
      console.log(`\nPerformance Gain: ${results.comparison.performanceGain.toFixed(2)}%`);
      
      if (results.comparison.performanceGain > 0) {
        console.log('🎉 SigmaSockets outperforms Simple WebSocket!');
      } else {
        console.log('⚠️  Simple WebSocket performs better in this test');
      }

      // Write results to file
      const fs = require('fs');
      fs.writeFileSync('benchmark-results.json', JSON.stringify(results, null, 2));
      console.log('\nResults saved to benchmark-results.json');
    })
    .catch((error) => {
      console.error('Benchmark failed:', error);
      process.exit(1);
    });
}

