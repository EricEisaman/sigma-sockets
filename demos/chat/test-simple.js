#!/usr/bin/env node

import puppeteer from 'puppeteer';

console.log('🚀 Starting simple FlatBuffers test...');

// Test with Puppeteer (server should already be running)
console.log('🌐 Testing with browser...');
const browser = await puppeteer.launch({ 
  headless: false,
  devtools: true 
});

const page = await browser.newPage();

// Capture console logs
page.on('console', msg => {
  console.log(`📱 Browser: ${msg.text()}`);
});

// Navigate to the chat demo
console.log('🌐 Navigating to http://localhost:3002...');
await page.goto('http://localhost:3002');

// Wait for connection
console.log('⏳ Waiting for WebSocket connection...');
await page.waitForFunction(() => {
  return window.connectionStatus === 'connected';
}, { timeout: 15000 });

console.log('✅ Connected! Sending test message...');

// Send a test message
await page.evaluate(() => {
  const input = document.querySelector('input[type="text"]');
  const button = document.querySelector('button[type="submit"]');
  
  if (input && button) {
    input.value = 'FlatBuffers test message';
    button.click();
  }
});

// Wait a moment for the message to be sent
await new Promise(resolve => setTimeout(resolve, 3000));

console.log('🏁 Test completed - check server logs for FlatBuffers debug output');

// Clean up
await browser.close();

console.log('✅ Test finished!');
