#!/usr/bin/env node

import WebSocket from 'ws';

console.log('🚀 Testing WebSocket with proper headers...');

const ws = new WebSocket('wss://sigma-sockets.onrender.com', {
  headers: {
    'Origin': 'https://sigma-sockets.onrender.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
});

ws.on('open', () => {
  console.log('✅ Connected to Render.com WebSocket server!');
  
  // Send a test message
  const testMessage = {
    type: 'chat',
    username: 'TestUser',
    timestamp: Date.now(),
    data: {
      message: 'Hello from fixed WebSocket test!'
    }
  };
  
  const jsonString = JSON.stringify(testMessage);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  
  console.log('📤 Sending test message:', testMessage);
  console.log('📤 JSON string:', jsonString);
  console.log('📤 Data bytes:', data);
  
  ws.send(data);
});

ws.on('message', (data) => {
  console.log('📥 Received message from server:');
  console.log('📥 Raw data length:', data.length);
  console.log('📥 Raw data (first 20 bytes):', Array.from(new Uint8Array(data).slice(0, 20)));
  
  try {
    const decoder = new TextDecoder();
    const message = decoder.decode(data);
    console.log('📥 Decoded message:', message);
  } catch (error) {
    console.log('📥 Could not decode as text, likely binary data');
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket closed: ${code} ${reason}`);
});

// Keep connection open for a bit
setTimeout(() => {
  console.log('🏁 Closing connection...');
  ws.close();
}, 5000);
