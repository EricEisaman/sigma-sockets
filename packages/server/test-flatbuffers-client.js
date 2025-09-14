/**
 * Test FlatBuffers format using SigmaSocketClient
 * 
 * This test uses the same client library as the chat demo to verify
 * that FlatBuffers messages are being sent correctly.
 */

import { SigmaSocketClient, ConnectionStatus } from 'sigmasockets-client';

async function testFlatBuffersWithClient() {
  console.log('🧪 Testing FlatBuffers format with SigmaSocketClient...');
  
  const client = new SigmaSocketClient({
    url: 'ws://localhost:3002',
    reconnectInterval: 3000,
    maxReconnectAttempts: 3,
    heartbeatInterval: 30000,
    debug: true
  });

  // Wait for connection
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 10000);

    client.on('connection', (status) => {
      console.log(`📡 Connection status: ${status}`);
      if (status === ConnectionStatus.Connected) {
        clearTimeout(timeout);
        resolve();
      } else if (status === ConnectionStatus.Error) {
        clearTimeout(timeout);
        reject(new Error('Connection failed'));
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
  
  // Create a simple test message as bytes (same as chat demo)
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

testFlatBuffersWithClient().catch(console.error);
