/**
 * Simple WebSocket test to check basic connectivity
 */

import WebSocket from 'ws';

console.log('🧪 Testing simple WebSocket connection...');

const ws = new WebSocket('ws://localhost:3002', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Origin': 'http://localhost:3000'
  }
});

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');
  
  // Send a simple test message
  const testMessage = 'Hello WebSocket!';
  console.log(`📤 Sending test message: ${testMessage}`);
  ws.send(testMessage);
});

ws.on('message', (data) => {
  console.log(`📥 Received message, size: ${data.length} bytes`);
  console.log(`📥 Data type: ${data.constructor.name}`);
  console.log(`📥 Content: ${data.toString()}`);
  
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
