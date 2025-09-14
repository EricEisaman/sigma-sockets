/**
 * Simple WebSocket test to check message format
 */

import WebSocket from 'ws';

console.log('🧪 Testing WebSocket message format...');

const ws = new WebSocket('ws://localhost:3002');

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');
  
  // Send a test message
  const testMessage = {
    type: 'chat',
    username: 'TestUser',
    timestamp: Date.now(),
    data: {
      message: 'Hello from test!'
    }
  };
  
  const messageBytes = new TextEncoder().encode(JSON.stringify(testMessage));
  console.log(`📤 Sending test message, size: ${messageBytes.length} bytes`);
  console.log(`📤 First 10 bytes: [${Array.from(messageBytes.slice(0, 10)).join(', ')}]`);
  
  ws.send(messageBytes);
});

ws.on('message', (data) => {
  console.log(`📥 Received message, size: ${data.length} bytes`);
  console.log(`📥 First 10 bytes: [${Array.from(data.slice(0, 10)).join(', ')}]`);
  console.log(`📥 Data type: ${data.constructor.name}`);
  console.log(`📥 Is ArrayBuffer: ${data instanceof ArrayBuffer}`);
  console.log(`📥 Is Buffer: ${Buffer.isBuffer(data)}`);
  
  // Try to decode as text
  try {
    const text = data.toString('utf8');
    console.log(`📥 As text: ${text.substring(0, 100)}...`);
  } catch (error) {
    console.log(`📥 Could not decode as text: ${error.message}`);
  }
  
  // Close after receiving one message
  ws.close();
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
  console.log('🔌 WebSocket connection closed');
  process.exit(0);
});
