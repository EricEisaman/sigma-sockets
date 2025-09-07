import { App, type WebSocket, OpCode, us_listen_socket_close } from 'uwebsockets.js';
import * as flatbuffers from 'flatbuffers';
import { Message } from './generated/sigma-sockets/message.js';
import { MessageType } from './generated/sigma-sockets/message-type.js';
// import { MessageData } from './generated/sigma-sockets/message-data.js';
import { DataMessage } from './generated/sigma-sockets/data-message.js';

interface ClientData {
  id: string;
  messageCount: number;
  startTime: number;
}

export class UWSBenchmarkServer {
  private app: any;
  private listenSocket: any;
  private clients: Map<WebSocket<ClientData>, ClientData> = new Map();
  private messageCount = 0;
  private startTime = 0;

  constructor(private port: number) {
    this.app = App({});
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.ws('/*', {
      compression: 0, // Disable compression for fair comparison
      maxCompressedSize: 64 * 1024,
      maxBackpressure: 64 * 1024,
      
      message: (ws: WebSocket<ClientData>, message: ArrayBuffer, _opCode: OpCode) => {
        this.handleMessage(ws, message);
      },
      
      open: (ws: WebSocket<ClientData>) => {
        const clientData: ClientData = {
          id: `client-${Date.now()}-${Math.random()}`,
          messageCount: 0,
          startTime: Date.now()
        };
        
        this.clients.set(ws, clientData);
        console.log(`µWS Client connected: ${clientData.id}`);
      },
      
      close: (ws: WebSocket<ClientData>, _code: number, _message: ArrayBuffer) => {
        const clientData = this.clients.get(ws);
        if (clientData) {
          console.log(`µWS Client disconnected: ${clientData.id}`);
          this.clients.delete(ws);
        }
      }
    });
  }

  private handleMessage(ws: WebSocket<ClientData>, message: ArrayBuffer): void {
    try {
      const buffer = new Uint8Array(message);
      const buf = new flatbuffers.ByteBuffer(buffer);
      const msg = Message.getRootAsMessage(buf);

      if (msg.type() === MessageType.Data) {
        const dataMsg = msg.data(new DataMessage());
        if (dataMsg) {
          // Echo the message back
          ws.send(buffer, OpCode.BINARY);
          this.messageCount++;
          
          const clientData = this.clients.get(ws);
          if (clientData) {
            clientData.messageCount++;
          }
        }
      }
    } catch (error) {
      console.error('µWS Message handling error:', error);
    }
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.startTime = Date.now();
      
      this.app.listen(this.port, (token: any) => {
        if (token) {
          this.listenSocket = token;
          console.log(`µWS server listening on port ${this.port}`);
          resolve();
        } else {
          reject(new Error(`Failed to listen on port ${this.port}`));
        }
      });
    });
  }

  public stop(): void {
    if (this.listenSocket) {
      us_listen_socket_close(this.listenSocket);
      this.listenSocket = null;
    }
  }

  public getStats() {
    const uptime = Date.now() - this.startTime;
    return {
      connectedClients: this.clients.size,
      totalMessages: this.messageCount,
      messagesPerSecond: this.messageCount / (uptime / 1000),
      uptime
    };
  }
}

