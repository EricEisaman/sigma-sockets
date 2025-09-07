import WebSocket from 'ws';
import * as flatbuffers from 'flatbuffers';
import { Message } from './generated/sigma-sockets/message';
import { MessageType } from './generated/sigma-sockets/message-type';
import { MessageData } from './generated/sigma-sockets/message-data';
import { DataMessage } from './generated/sigma-sockets/data-message';
import { ConnectMessage } from './generated/sigma-sockets/connect-message';

export interface BenchmarkResult {
  totalMessages: number;
  duration: number;
  messagesPerSecond: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  errors: number;
  packageSize?: {
    bundleSize: number;
    gzippedSize: number;
    dependencies: number;
    totalSize: number;
  };
}

export class BenchmarkClient {
  private ws: WebSocket | null = null;
  private messagesSent = 0;
  private messagesReceived = 0;
  private errors = 0;
  private latencies: number[] = [];
  private startTime = 0;
  private endTime = 0;
  private messageTimes: Map<string, number> = new Map();

  constructor(
    private url: string,
    private totalMessages: number,
    private messageSize: number,
    private isSigmaSocket: boolean = false
  ) {}

  public async run(): Promise<BenchmarkResult> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.on('open', () => {
        console.log(`Connected to ${this.url}`);
        
        if (this.isSigmaSocket) {
          // Send connect message for SigmaSockets
          this.sendConnectMessage();
        }
        
        this.startTime = Date.now();
        this.sendMessages();
      });

      this.ws.on('message', (data: ArrayBuffer) => {
        this.handleMessage(data);
        
        if (this.messagesReceived >= this.totalMessages) {
          this.endTime = Date.now();
          this.ws?.close();
          resolve(this.calculateResults());
        }
      });

      this.ws.on('error', (error) => {
        this.errors++;
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        if (this.messagesReceived < this.totalMessages) {
          resolve(this.calculateResults());
        }
      });
    });
  }

  private sendConnectMessage(): void {
    const builder = new flatbuffers.Builder(512);
    const sessionId = builder.createString(`benchmark-${Date.now()}`);
    const clientVersion = builder.createString('1.0.0');

    ConnectMessage.startConnectMessage(builder);
    ConnectMessage.addSessionId(builder, sessionId);
    ConnectMessage.addClientVersion(builder, clientVersion);
    const connectMsg = ConnectMessage.endConnectMessage(builder);

    Message.startMessage(builder);
    Message.addType(builder, MessageType.Connect);
    Message.addDataType(builder, MessageData.ConnectMessage);
    Message.addData(builder, connectMsg);
    const message = Message.endMessage(builder);

    builder.finish(message);
    this.ws?.send(builder.asUint8Array());
  }

  private sendMessages(): void {
    const payload = new Uint8Array(this.messageSize);
    // Fill with random data
    for (let i = 0; i < payload.length; i++) {
      payload[i] = Math.floor(Math.random() * 256);
    }

    for (let i = 0; i < this.totalMessages; i++) {
      setTimeout(() => {
        this.sendDataMessage(payload, i);
      }, i * 10); // Send every 10ms to avoid overwhelming
    }
  }

  private sendDataMessage(payload: Uint8Array, messageIndex: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.errors++;
      return;
    }

    try {
      const builder = new flatbuffers.Builder(1024 + payload.length);
      const payloadVector = DataMessage.createPayloadVector(builder, payload);
      const messageId = BigInt(messageIndex);
      const timestamp = BigInt(Date.now());

      DataMessage.startDataMessage(builder);
      DataMessage.addPayload(builder, payloadVector);
      DataMessage.addMessageId(builder, messageId);
      DataMessage.addTimestamp(builder, timestamp);
      const dataMsg = DataMessage.endDataMessage(builder);

      Message.startMessage(builder);
      Message.addType(builder, MessageType.Data);
      Message.addDataType(builder, MessageData.DataMessage);
      Message.addData(builder, dataMsg);
      const message = Message.endMessage(builder);

      builder.finish(message);
      
      const messageKey = messageId.toString();
      this.messageTimes.set(messageKey, Date.now());
      
      this.ws.send(builder.asUint8Array());
      this.messagesSent++;
    } catch (error) {
      this.errors++;
      console.error('Error sending message:', error);
    }
  }

  private handleMessage(data: ArrayBuffer): void {
    try {
      const buffer = new Uint8Array(data);
      const buf = new flatbuffers.ByteBuffer(buffer);
      const message = Message.getRootAsMessage(buf);

      if (message.type() === MessageType.Data) {
        const dataMsg = message.data(new DataMessage());
        if (dataMsg) {
          const messageId = dataMsg.messageId().toString();
          const sentTime = this.messageTimes.get(messageId);
          
          if (sentTime) {
            const latency = Date.now() - sentTime;
            this.latencies.push(latency);
            this.messageTimes.delete(messageId);
          }
          
          this.messagesReceived++;
        }
      }
    } catch (error) {
      this.errors++;
      console.error('Error handling message:', error);
    }
  }

  private calculateResults(): BenchmarkResult {
    const duration = this.endTime - this.startTime;
    const messagesPerSecond = this.messagesReceived / (duration / 1000);
    
    let averageLatency = 0;
    let minLatency = 0;
    let maxLatency = 0;
    
    if (this.latencies.length > 0) {
      averageLatency = this.latencies.reduce((sum, lat) => sum + lat, 0) / this.latencies.length;
      minLatency = Math.min(...this.latencies);
      maxLatency = Math.max(...this.latencies);
    }

    return {
      totalMessages: this.messagesReceived,
      duration,
      messagesPerSecond,
      averageLatency,
      minLatency,
      maxLatency,
      errors: this.errors
    };
  }
}

