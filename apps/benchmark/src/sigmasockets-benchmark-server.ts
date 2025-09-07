import { SigmaSocketServer } from 'sigmasockets-server';
import { WebSocket } from 'ws';

// Local type definition to avoid import issues
interface ClientSession {
  id: string;
  ws: WebSocket;
  isAlive: boolean;
  messageBuffer: Uint8Array[];
}

export class SigmaSocketsBenchmarkServer {
  private server: SigmaSocketServer;
  private messageCount = 0;
  private startTime = 0;

  constructor(private port: number) {
    this.server = new SigmaSocketServer({
      port: this.port,
      host: '0.0.0.0',
      heartbeatInterval: 30000,
      maxConnections: 1000
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.server.on('connection', (client: ClientSession) => {
      console.log(`SigmaSockets Client connected: ${client.id}`);
    });

    this.server.on('disconnection', (client: ClientSession, reason: string) => {
      console.log(`SigmaSockets Client disconnected: ${client.id} (${reason})`);
    });

    this.server.on('message', (client: ClientSession, data: Uint8Array, _messageId: bigint, _timestamp: bigint) => {
      // Echo the message back
      this.server.sendToClient(client, data);
      this.messageCount++;
    });

    this.server.on('error', (error: Error) => {
      console.error('SigmaSockets Server error:', error);
    });
  }

  public async start(): Promise<void> {
    this.startTime = Date.now();
    await this.server.start();
    console.log(`SigmaSockets server listening on port ${this.port}`);
  }

  public async stop(): Promise<void> {
    await this.server.stop();
  }

  public getStats() {
    const serverStats = this.server.getStats();
    const uptime = Date.now() - this.startTime;
    
    return {
      connectedClients: serverStats.connectedClients,
      totalMessages: this.messageCount,
      messagesPerSecond: this.messageCount / (uptime / 1000),
      uptime,
      serverStats
    };
  }
}

