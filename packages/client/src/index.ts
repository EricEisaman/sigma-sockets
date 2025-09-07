import * as flatbuffers from 'flatbuffers';
import { Message } from './generated/sigma-sockets/message';
import { MessageType } from './generated/sigma-sockets/message-type';
import { MessageData } from './generated/sigma-sockets/message-data';
import { ConnectMessage } from './generated/sigma-sockets/connect-message';
import { DataMessage } from './generated/sigma-sockets/data-message';
import { HeartbeatMessage } from './generated/sigma-sockets/heartbeat-message';
import { ReconnectMessage } from './generated/sigma-sockets/reconnect-message';
import { DisconnectMessage } from './generated/sigma-sockets/disconnect-message';
import { ConnectionStatus } from './types';
import type { 
  SigmaSocketConfig, 
  MessageCallback, 
  ConnectionCallback,
  ReconnectionInfo,
  SigmaSocketEvents,
  ClientSession
} from './types';

// Re-export types and values for external use
export { ConnectionStatus };
export type { SigmaSocketConfig, MessageCallback, ConnectionCallback, ReconnectionInfo, SigmaSocketEvents, ClientSession };

export class SigmaSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<SigmaSocketConfig>;
  private status: ConnectionStatus = ConnectionStatus.Disconnected;
  private session: ClientSession | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageIdCounter = 0n;
  private eventListeners: Map<keyof SigmaSocketEvents, Set<Function>> = new Map();

  constructor(config: SigmaSocketConfig) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval ?? 1000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      sessionTimeout: config.sessionTimeout ?? 300000,
      debug: config.debug ?? false
    };

    // Initialize event listener sets
    this.eventListeners.set('connection', new Set());
    this.eventListeners.set('message', new Set());
    this.eventListeners.set('error', new Set());
    this.eventListeners.set('reconnecting', new Set());
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.status === ConnectionStatus.Connected || this.status === ConnectionStatus.Connecting) {
        resolve();
        return;
      }

      this.setStatus(ConnectionStatus.Connecting);
      
      try {
        this.ws = new WebSocket(this.config.url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          this.onWebSocketOpen();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.onWebSocketMessage(event);
        };

        this.ws.onclose = (event) => {
          this.onWebSocketClose(event);
        };

        this.ws.onerror = (event) => {
          const error = new Error(`WebSocket error: ${event}`);
          this.onWebSocketError(error);
          reject(error);
        };

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.onWebSocketError(err);
        reject(err);
      }
    });
  }

  public disconnect(): void {
    this.clearTimers();
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send disconnect message
      const builder = new flatbuffers.Builder(1024);
      const reason = builder.createString('Client disconnect');
      
      DisconnectMessage.startDisconnectMessage(builder);
      DisconnectMessage.addReason(builder, reason);
      const disconnectMsg = DisconnectMessage.endDisconnectMessage(builder);

      Message.startMessage(builder);
      Message.addType(builder, MessageType.Disconnect);
      Message.addDataType(builder, MessageData.DisconnectMessage);
      Message.addData(builder, disconnectMsg);
      const message = Message.endMessage(builder);

      builder.finish(message);
      this.ws.send(builder.asUint8Array());
      this.ws.close(1000, 'Normal closure');
    }

    this.ws = null;
    this.session = null;
    this.setStatus(ConnectionStatus.Disconnected);
  }

  public send(data: Uint8Array): boolean {
    if (this.status !== ConnectionStatus.Connected || !this.ws) {
      if (this.config.debug) {
        console.log('❌ Client not connected or WebSocket not available');
      }
      return false;
    }

    try {
      if (this.config.debug) {
        console.log('🔧 Creating FlatBuffers message...');
      }
      const builder = new flatbuffers.Builder(1024 + data.length);
      const payload = DataMessage.createPayloadVector(builder, data);
      const messageId = ++this.messageIdCounter;
      const timestamp = BigInt(Date.now());

      DataMessage.startDataMessage(builder);
      DataMessage.addPayload(builder, payload);
      DataMessage.addMessageId(builder, messageId);
      DataMessage.addTimestamp(builder, timestamp);
      const dataMsg = DataMessage.endDataMessage(builder);

      Message.startMessage(builder);
      Message.addType(builder, MessageType.Data);
      Message.addDataType(builder, MessageData.DataMessage);
      Message.addData(builder, dataMsg);
      const message = Message.endMessage(builder);

      builder.finish(message);
      const flatbuffersData = builder.asUint8Array();
      
      // Validate the built FlatBuffer by parsing it back (like the example)
      if (this.config.debug) {
        console.log('🔧 Sending FlatBuffers message, size:', flatbuffersData.length);
        
        // Validate by parsing back (following the example pattern)
        try {
          const bb = new flatbuffers.ByteBuffer(flatbuffersData);
          const validationMessage = Message.getRootAsMessage(bb);
          const messageType = validationMessage.type();
          const dataType = validationMessage.dataType();
          
          if (messageType === MessageType.Data && dataType === MessageData.DataMessage) {
            console.log('✅ FlatBuffers validation successful - DataMessage confirmed');
          } else {
            console.warn('⚠️ FlatBuffers validation warning - unexpected message type:', messageType, dataType);
          }
        } catch (validationError) {
          console.error('❌ FlatBuffers validation failed:', validationError);
          throw new Error('Built FlatBuffer failed validation');
        }
      }
      
      this.ws.send(flatbuffersData);

      if (this.session) {
        this.session.lastMessageId = messageId;
      }

      return true;
    } catch (error) {
      if (this.config.debug) {
        console.error('❌ FlatBuffers serialization failed:', error);
      }
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  public on<K extends keyof SigmaSocketEvents>(event: K, callback: SigmaSocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  public off<K extends keyof SigmaSocketEvents>(event: K, callback: SigmaSocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getSession(): ClientSession | null {
    return this.session;
  }

  private onWebSocketOpen(): void {
    this.reconnectAttempts = 0;
    
    // Send connect or reconnect message
    const builder = new flatbuffers.Builder(1024);
    const clientVersion = builder.createString('1.0.0');
    
    if (this.session) {
      // Reconnecting with existing session
      const sessionId = builder.createString(this.session.id);
      
      ReconnectMessage.startReconnectMessage(builder);
      ReconnectMessage.addSessionId(builder, sessionId);
      ReconnectMessage.addLastMessageId(builder, this.session.lastMessageId);
      const reconnectMsg = ReconnectMessage.endReconnectMessage(builder);

      Message.startMessage(builder);
      Message.addType(builder, MessageType.Reconnect);
      Message.addDataType(builder, MessageData.ReconnectMessage);
      Message.addData(builder, reconnectMsg);
      const message = Message.endMessage(builder);

      builder.finish(message);
      this.ws?.send(builder.asUint8Array());
    } else {
      // New connection
      const sessionId = builder.createString(this.generateSessionId());
      
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

      // Create new session
      this.session = {
        id: sessionId.toString(),
        lastMessageId: 0n,
        connectedAt: new Date(),
        lastHeartbeat: new Date()
      };
    }

    this.setStatus(ConnectionStatus.Connected);
    this.startHeartbeat();
  }

  private onWebSocketMessage(event: MessageEvent): void {
    try {
      const buffer = new Uint8Array(event.data);
      const buf = new flatbuffers.ByteBuffer(buffer);
      const message = Message.getRootAsMessage(buf);
      
      // Validate the received message (following the example pattern)
      if (this.config.debug) {
        const messageType = message.type();
        const dataType = message.dataType();
        console.log('📥 Received FlatBuffers message - type:', messageType, 'dataType:', dataType);
        
        // Validate message type is within expected range
        if (messageType < 0 || messageType > 6) {
          console.error('❌ Invalid message type received:', messageType);
          return;
        }
      }

      switch (message.type()) {
        case MessageType.Data:
          this.handleDataMessage(message);
          break;
        case MessageType.Heartbeat:
          this.handleHeartbeatMessage(message);
          break;
        case MessageType.Error:
          this.handleErrorMessage(message);
          break;
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private onWebSocketClose(_event: CloseEvent): void {
    this.clearTimers();
    
    if (this.status === ConnectionStatus.Connected) {
      // Unexpected disconnection, attempt to reconnect
      this.setStatus(ConnectionStatus.Reconnecting);
      this.scheduleReconnect();
    } else {
      this.setStatus(ConnectionStatus.Disconnected);
    }
  }

  private onWebSocketError(error: Error): void {
    this.setStatus(ConnectionStatus.Error);
    this.emit('error', error);
  }

  private handleDataMessage(message: Message): void {
    // Validate message data type (following the example pattern)
    if (message.dataType() !== MessageData.DataMessage) {
      if (this.config.debug) {
        console.error('❌ Expected DataMessage but got dataType:', message.dataType());
      }
      return;
    }
    
    const dataMsg = message.data(new DataMessage());
    if (!dataMsg) {
      if (this.config.debug) {
        console.error('❌ Failed to create DataMessage from message');
      }
      return;
    }
    
    // Extract payload using the generated accessor (following the example pattern)
    const payloadArray = dataMsg.payloadArray();
    if (!payloadArray) {
      if (this.config.debug) {
        console.error('❌ No payload found in DataMessage');
      }
      return;
    }
    
    const payload = new Uint8Array(payloadArray);
    
    if (this.config.debug) {
      console.log('✅ DataMessage processed - payload size:', payload.length, 'messageId:', dataMsg.messageId());
    }
    
    this.emit('message', payload, dataMsg.messageId(), dataMsg.timestamp());
  }

  private handleHeartbeatMessage(_message: Message): void {
    if (this.session) {
      this.session.lastHeartbeat = new Date();
    }
    
    // Send heartbeat response
    const builder = new flatbuffers.Builder(256);
    const timestamp = BigInt(Date.now());
    
    HeartbeatMessage.startHeartbeatMessage(builder);
    HeartbeatMessage.addTimestamp(builder, timestamp);
    const heartbeatMsg = HeartbeatMessage.endHeartbeatMessage(builder);

    Message.startMessage(builder);
    Message.addType(builder, MessageType.Heartbeat);
    Message.addDataType(builder, MessageData.HeartbeatMessage);
    Message.addData(builder, heartbeatMsg);
    const responseMessage = Message.endMessage(builder);

    builder.finish(responseMessage);
    this.ws?.send(builder.asUint8Array());
  }

  private handleErrorMessage(_message: Message): void {
    // Handle server error messages
    const error = new Error('Server error received');
    this.emit('error', error);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.setStatus(ConnectionStatus.Error);
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000
    );

    this.emit('reconnecting', {
      attempt: this.reconnectAttempts + 1,
      maxAttempts: this.config.maxReconnectAttempts,
      nextRetryIn: delay
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        // Connection failed, will be handled by onWebSocketError
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.status === ConnectionStatus.Connected && this.ws) {
        const builder = new flatbuffers.Builder(256);
        const timestamp = BigInt(Date.now());
        
        HeartbeatMessage.startHeartbeatMessage(builder);
        HeartbeatMessage.addTimestamp(builder, timestamp);
        const heartbeatMsg = HeartbeatMessage.endHeartbeatMessage(builder);

        Message.startMessage(builder);
        Message.addType(builder, MessageType.Heartbeat);
        Message.addDataType(builder, MessageData.HeartbeatMessage);
        Message.addData(builder, heartbeatMsg);
        const message = Message.endMessage(builder);

        builder.finish(message);
        this.ws.send(builder.asUint8Array());
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('connection', status);
    }
  }

  private emit<K extends keyof SigmaSocketEvents>(event: K, ...args: Parameters<SigmaSocketEvents[K]>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as Function)(...args);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

