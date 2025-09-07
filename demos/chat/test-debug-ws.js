#!/usr/bin/env node

import WebSocket from 'ws';

console.log('🚀 Testing WebSocket with detailed logging...');

const ws = new WebSocket('wss://sigma-sockets.onrender.com');

ws.on('open', () => {
  console.log('✅ Connected to Render.com WebSocket server!');
  
  // Send a Connect message first (like SigmaSocketClient does)
  console.log('📤 Sending Connect message...');
  
  // Create a simple Connect message
  const connectMessage = {
    type: 'connect',
    sessionId: 'test-session-' + Date.now(),
    clientVersion: '1.0.0'
  };
  
  const jsonString = JSON.stringify(connectMessage);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  
  console.log('📤 Connect message:', connectMessage);
  console.log('📤 JSON string:', jsonString);
  console.log('📤 Data bytes:', data);
  
  ws.send(data);
  
  // Wait a bit, then send a chat message
  setTimeout(() => {
    const testMessage = {
      type: 'chat',
      username: 'TestUser',
      timestamp: Date.now(),
      data: {
        message: 'Hello from debug test!'
      }
    };
    
    const jsonString2 = JSON.stringify(testMessage);
    const encoder2 = new TextEncoder();
    const data2 = encoder2.encode(jsonString2);
    
    console.log('📤 Chat message:', testMessage);
    console.log('📤 JSON string:', jsonString2);
    console.log('📤 Data bytes:', data2);
    
    ws.send(data2);
  }, 1000);
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
