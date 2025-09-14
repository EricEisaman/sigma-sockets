/**
 * Hybrid Message Handler
 * 
 * This module provides a hybrid approach to handle both JSON and FlatBuffers
 * messages, allowing for flexible client communication while maintaining
 * the performance benefits of FlatBuffers for production use.
 */

import * as flatbuffers from 'flatbuffers';
import { Message } from './generated/sigma-sockets/message';
import { MessageType } from './generated/sigma-sockets/message-type';
import { MessageData } from './generated/sigma-sockets/message-data';
import { DataMessage } from './generated/sigma-sockets/data-message';
import { ConnectMessage } from './generated/sigma-sockets/connect-message';
import { HeartbeatMessage } from './generated/sigma-sockets/heartbeat-message';

export interface HybridMessageResult {
  success: boolean;
  messageType?: MessageType;
  data?: any;
  error?: string;
  isFlatBuffers?: boolean;
  isJSON?: boolean;
}

export interface JSONMessage {
  type: string;
  [key: string]: any;
}

export class HybridMessageHandler {
  /**
   * Detects if data looks like JSON based on first and last bytes
   */
  private static looksLikeJSON(data: Uint8Array): boolean {
    if (data.length === 0) return false;
    
    const firstByte = data[0];
    const lastByte = data[data.length - 1];
    
    // Check for JSON patterns: { }, [ ], or string starting with quote
    return (firstByte === 123 && lastByte === 125) || // { }
           (firstByte === 91 && lastByte === 93) ||   // [ ]
           (firstByte === 34);                        // starts with quote
  }

  /**
   * Detects if data looks like FlatBuffers based on structure
   */
  private static looksLikeFlatBuffers(data: Uint8Array): boolean {
    if (data.length < 8) return false;
    
    try {
      const buf = new flatbuffers.ByteBuffer(data);
      const message = Message.getRootAsMessage(buf);
      
      if (!message) return false;
      
      // Check if message type is within valid range
      const messageType = message.type();
      return messageType >= 0 && messageType <= 5;
    } catch {
      return false;
    }
  }

  /**
   * Parses JSON message and converts to standardized format
   */
  private static parseJSONMessage(data: Uint8Array): HybridMessageResult {
    try {
      const jsonString = new TextDecoder().decode(data);
      const jsonMessage: JSONMessage = JSON.parse(jsonString);
      
      // Map JSON message types to FlatBuffers MessageType
      let messageType: MessageType;
      switch (jsonMessage.type) {
        case 'connect':
        case 'connection':
          messageType = MessageType.Connect;
          break;
        case 'disconnect':
          messageType = MessageType.Disconnect;
          break;
        case 'data':
        case 'message':
        case 'rtt_test':
        case 'efficiency_test':
        case 'benchmark_test':
        case 'resource_test':
        case 'client_message':
        case 'persistence_test':
        case 'quality_test':
        case 'test':
          messageType = MessageType.Data;
          break;
        case 'heartbeat':
        case 'ping':
          messageType = MessageType.Heartbeat;
          break;
        case 'reconnect':
          messageType = MessageType.Reconnect;
          break;
        case 'error':
          messageType = MessageType.Error;
          break;
        default:
          // Default to Data message for unknown types
          messageType = MessageType.Data;
      }
      
      return {
        success: true,
        messageType,
        data: jsonMessage,
        isJSON: true
      };
    } catch (error) {
      return {
        success: false,
        error: `JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parses FlatBuffers message
   */
  private static parseFlatBuffersMessage(data: Uint8Array): HybridMessageResult {
    try {
      const buf = new flatbuffers.ByteBuffer(data);
      const message = Message.getRootAsMessage(buf);
      
      if (!message) {
        return {
          success: false,
          error: 'Invalid FlatBuffers message structure'
        };
      }
      
      const messageType = message.type();
      
      // Extract data based on message type
      let extractedData: any = {};
      
      switch (messageType) {
        case MessageType.Connect:
          const connectMsg = message.data(new ConnectMessage());
          if (connectMsg) {
            extractedData = {
              sessionId: connectMsg.sessionId(),
              clientVersion: connectMsg.clientVersion()
            };
          }
          break;
          
        case MessageType.Data:
          const dataMsg = message.data(new DataMessage());
          if (dataMsg) {
            extractedData = {
              payload: dataMsg.payloadArray(),
              messageId: dataMsg.messageId(),
              timestamp: dataMsg.timestamp()
            };
          }
          break;
          
        case MessageType.Heartbeat:
          const heartbeatMsg = message.data(new HeartbeatMessage());
          if (heartbeatMsg) {
            extractedData = {
              timestamp: heartbeatMsg.timestamp()
            };
          }
          break;
          
        default:
          extractedData = { type: messageType };
      }
      
      return {
        success: true,
        messageType,
        data: extractedData,
        isFlatBuffers: true
      };
    } catch (error) {
      return {
        success: false,
        error: `FlatBuffers parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Main method to handle hybrid message parsing
   */
  static handleMessage(data: Uint8Array): HybridMessageResult {
    // First, try to detect format
    if (this.looksLikeJSON(data)) {
      console.log('🔍 Detected JSON format, parsing as JSON...');
      return this.parseJSONMessage(data);
    }
    
    if (this.looksLikeFlatBuffers(data)) {
      console.log('🔍 Detected FlatBuffers format, parsing as FlatBuffers...');
      return this.parseFlatBuffersMessage(data);
    }
    
    // If neither format is detected, try JSON first (more forgiving)
    console.log('🔍 Format unclear, trying JSON first...');
    const jsonResult = this.parseJSONMessage(data);
    if (jsonResult.success) {
      return jsonResult;
    }
    
    // If JSON fails, try FlatBuffers
    console.log('🔍 JSON failed, trying FlatBuffers...');
    const flatBuffersResult = this.parseFlatBuffersMessage(data);
    if (flatBuffersResult.success) {
      return flatBuffersResult;
    }
    
    // Both failed
    return {
      success: false,
      error: 'Unable to parse message as either JSON or FlatBuffers'
    };
  }

  /**
   * Creates a FlatBuffers response message from JSON data
   */
  static createFlatBuffersResponse(messageType: MessageType, data: any): Uint8Array | null {
    try {
      const builder = new flatbuffers.Builder(1024);
      
      switch (messageType) {
        case MessageType.Data:
          const payload = new TextEncoder().encode(JSON.stringify(data));
          const payloadVector = DataMessage.createPayloadVector(builder, payload);
          
          DataMessage.startDataMessage(builder);
          DataMessage.addPayload(builder, payloadVector);
          DataMessage.addMessageId(builder, BigInt(Date.now()));
          DataMessage.addTimestamp(builder, BigInt(Date.now()));
          const dataMsg = DataMessage.endDataMessage(builder);
          
          Message.startMessage(builder);
          Message.addType(builder, MessageType.Data);
          Message.addDataType(builder, MessageData.DataMessage);
          Message.addData(builder, dataMsg);
          const message = Message.endMessage(builder);
          
          builder.finish(message);
          return builder.asUint8Array();
          
        case MessageType.Heartbeat:
          HeartbeatMessage.startHeartbeatMessage(builder);
          HeartbeatMessage.addTimestamp(builder, BigInt(Date.now()));
          const heartbeatMsg = HeartbeatMessage.endHeartbeatMessage(builder);
          
          Message.startMessage(builder);
          Message.addType(builder, MessageType.Heartbeat);
          Message.addDataType(builder, MessageData.HeartbeatMessage);
          Message.addData(builder, heartbeatMsg);
          const heartbeatMessage = Message.endMessage(builder);
          
          builder.finish(heartbeatMessage);
          return builder.asUint8Array();
          
        default:
          return null;
      }
    } catch (error) {
      console.error('Failed to create FlatBuffers response:', error);
      return null;
    }
  }

  /**
   * Creates a JSON response message
   */
  static createJSONResponse(messageType: string, data: any): string {
    return JSON.stringify({
      type: messageType,
      data: data,
      timestamp: Date.now()
    });
  }
}
