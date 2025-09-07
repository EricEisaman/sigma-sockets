#!/usr/bin/env node

import { SigmaSocketServer } from 'sigmasockets-server';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as flatbuffers from 'flatbuffers';
import { Message } from './dist/generated/sigma-sockets/message.js';
import { MessageType } from './dist/generated/sigma-sockets/message-type.js';
import { DataMessage } from './dist/generated/sigma-sockets/data-message.js';

console.log('🚀 Starting development chat server...');

const port = parseInt(process.env['PORT'] || '3001');
console.log(`🔧 Port configuration: WebSocket=${port}`);

// Create WebSocket server for development
const wsServer = new SigmaSocketServer({
  port: port,
  host: '0.0.0.0',
  heartbeatInterval: 30000,
  sessionTimeout: 300000,
  maxConnections: 1000,
  requestHandler: (req, res) => {
    // Simple health check for development
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Development WebSocket server running'
      }));
      return;
    }
    
    // For development, just return a simple message
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server running. Use the Vite dev server for the frontend.');
  }
});

// Set up message handling
wsServer.on('connection', (clientId, session) => {
  console.log(`📡 Client connected: ${clientId}`);
});

wsServer.on('message', (data, messageId, timestamp, session) => {
  console.log(`📥 Received message from ${session?.id || 'unknown'}`);
  console.log(`📥 MessageId: ${messageId}, Timestamp: ${timestamp}`);
  console.log(`📥 Data type: ${typeof data}, Data constructor: ${data?.constructor?.name}`);
  
  try {
    // Handle different data types
    let dataArray;
    if (data instanceof Uint8Array) {
      dataArray = data;
    } else if (data instanceof ArrayBuffer) {
      dataArray = new Uint8Array(data);
    } else if (Array.isArray(data)) {
      dataArray = new Uint8Array(data);
    } else if (typeof data === 'string') {
      dataArray = new TextEncoder().encode(data);
    } else if (typeof data === 'bigint') {
      // Handle BigInt case - this shouldn't happen but let's handle it
      console.error('❌ Received BigInt data - this indicates a server library issue');
      return;
    } else {
      console.error('❌ Unknown data type:', typeof data, data);
      return;
    }
    
    console.log(`📥 Data length: ${dataArray.length}`);
    console.log(`📥 First 20 bytes: [${Array.from(dataArray.slice(0, 20)).join(', ')}]`);
    
    // Parse the FlatBuffers message
    const buffer = new flatbuffers.ByteBuffer(dataArray);
    const message = Message.getRootAsMessage(buffer);
    const messageType = message.type();
    
    console.log(`📥 Message type: ${messageType} (expected: ${MessageType.Data})`);
    
    if (messageType === MessageType.Data) {
      console.log(`📥 Processing DataMessage...`);
      const dataMessage = message.data(new DataMessage());
      
      // Check if DataMessage exists
      if (!dataMessage) {
        console.log(`❌ DataMessage is null`);
        return;
      }
      
      console.log(`📥 DataMessage payload length: ${dataMessage.payloadLength()}`);
      
      // Get the payload as a string - try different methods
      let payloadString = null;
      
      // Method 1: Direct payload access
      try {
        payloadString = dataMessage.payload();
        console.log(`📥 Method 1 - Direct payload: ${payloadString ? 'SUCCESS' : 'NULL'}`);
      } catch (e) {
        console.log(`📥 Method 1 - Direct payload failed: ${e.message}`);
      }
      
      // Method 2: Access payload by index
      if (!payloadString && dataMessage.payloadLength() > 0) {
        try {
          const payloadBytes = [];
          for (let i = 0; i < dataMessage.payloadLength(); i++) {
            const byte = dataMessage.payload(i);
            if (byte !== null && byte !== undefined) {
              payloadBytes.push(byte);
            }
          }
          if (payloadBytes.length > 0) {
            payloadString = new TextDecoder().decode(new Uint8Array(payloadBytes));
            console.log(`📥 Method 2 - Byte array payload: SUCCESS`);
          }
        } catch (e) {
          console.log(`📥 Method 2 - Byte array payload failed: ${e.message}`);
        }
      }
      
      if (payloadString) {
        console.log(`📝 Message payload: ${payloadString}`);
        
        // Broadcast the JSON payload as UTF-8 bytes to all connected clients
        const jsonBytes = new TextEncoder().encode(payloadString);
        const numericMessageId = typeof messageId === 'bigint' ? Number(messageId) : messageId;
        const numericTimestamp = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
        console.log(`📤 Broadcasting JSON payload to all clients...`);
        wsServer.broadcast(jsonBytes, numericMessageId, numericTimestamp);
        console.log(`✅ Message broadcasted successfully`);
      } else {
        console.log(`❌ No payload string found in DataMessage`);
        console.log(`📥 DataMessage details:`, {
          messageId: dataMessage.messageId(),
          timestamp: dataMessage.timestamp(),
          payloadLength: dataMessage.payloadLength()
        });
      }
    } else {
      console.log(`❌ Unexpected message type: ${messageType}`);
    }
  } catch (error) {
    console.error('❌ Error processing message:', error);
  }
});

wsServer.on('disconnection', (clientId) => {
  console.log(`📡 Client disconnected: ${clientId}`);
});

wsServer.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Start the server
wsServer.start().then(() => {
  console.log(`🚀 Development WebSocket server started on port ${port}`);
  console.log(`🔌 WebSocket available at ws://localhost:${port}`);
  console.log(`🌐 Health check available at http://localhost:${port}/health`);
  console.log(`📱 Frontend should be running on http://localhost:3000`);
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
