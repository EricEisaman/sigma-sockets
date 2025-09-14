/**
 * Test script to verify FlatBuffers message format
 * 
 * This script connects to the WebSocket server and sends a test message
 * to verify that proper FlatBuffers format is being used.
 */

import { SigmaSocketClient, ConnectionStatus } from 'sigmasockets-client';
import * as flatbuffers from 'flatbuffers';

async function testFlatBuffersFormat() {
  console.log('🧪 Testing FlatBuffers message format...');
  
  const client = new SigmaSocketClient({
    url: 'ws://localhost:3002',
    reconnectInterval: 3000,
    maxReconnectAttempts: 3,
    heartbeatInterval: 30000,
    debug: true
  });

  // Wait for connection
  await new Promise((resolve) => {
    client.on('connection', (status) => {
      console.log(`📡 Connection status: ${status}`);
      if (status === ConnectionStatus.Connected) {
        resolve();
      }
    });
    client.connect();
  });

  // Create a test message
  const testMessage = {
    type: 'chat',
    username: 'TestUser',
    timestamp: Date.now(),
    data: {
      message: 'Hello from FlatBuffers test!'
    }
  };

  console.log('📤 Creating test message...');
  
  // Create a simple test message as bytes
  const messageBytes = new TextEncoder().encode(JSON.stringify(testMessage));
  
  console.log(`📦 Test message created, size: ${messageBytes.length} bytes`);
  console.log(`📦 First 10 bytes: [${Array.from(messageBytes.slice(0, 10)).join(', ')}]`);
  console.log(`📦 Data type: ${messageBytes.constructor.name}`);
  console.log(`📦 Is ArrayBuffer: ${messageBytes instanceof ArrayBuffer}`);
  console.log(`📦 Is TypedArray: ${ArrayBuffer.isView(messageBytes)}`);
  
  // Send the message using the client's send method (which will wrap it in FlatBuffers)
  console.log('📤 Sending message via client.send()...');
  const success = client.send(messageBytes);
  console.log(`📤 Send result: ${success}`);
  
  // Wait a moment for the message to be processed
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Disconnect
  client.disconnect();
  console.log('✅ Test completed');
}

testFlatBuffersFormat().catch(console.error);
