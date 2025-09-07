#!/usr/bin/env node

import { SigmaSocketClient } from 'sigmasockets-client';

console.log('🚀 Testing SigmaSocketClient directly to Render.com...');

const client = new SigmaSocketClient({
  url: 'wss://sigma-sockets.onrender.com',
  debug: true
});

client.on('connection', (status) => {
  console.log('📡 Connection status:', status);
  
  if (status === 'connected') {
    console.log('✅ Connected! Sending test message...');
    
    const testMessage = {
      type: 'chat',
      username: 'TestUser',
      timestamp: Date.now(),
      data: {
        message: 'Hello from SigmaSocketClient test!'
      }
    };
    
    const jsonString = JSON.stringify(testMessage);
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    
    console.log('📤 Sending message:', testMessage);
    console.log('📤 JSON string:', jsonString);
    console.log('📤 Data bytes:', data);
    
    const success = client.send(data);
    console.log('📤 Send result:', success);
  }
});

client.on('message', (data, messageId, timestamp) => {
  console.log('📥 Received message from server:');
  console.log('📥 Message ID:', messageId);
  console.log('📥 Timestamp:', timestamp);
  console.log('📥 Data length:', data.length);
  
  try {
    const decoder = new TextDecoder();
    const message = decoder.decode(data);
    console.log('📥 Decoded message:', message);
  } catch (error) {
    console.log('📥 Could not decode as text, likely binary data');
  }
});

client.on('error', (error) => {
  console.error('❌ Client error:', error);
});

// Connect
client.connect().then(() => {
  console.log('🔌 Connection initiated...');
}).catch((error) => {
  console.error('❌ Connection failed:', error);
});

// Keep connection open for a bit
setTimeout(() => {
  console.log('🏁 Closing connection...');
  client.disconnect();
}, 10000);
