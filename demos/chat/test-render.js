#!/usr/bin/env node

import puppeteer from 'puppeteer';

console.log('🚀 Testing FlatBuffers against Render.com server...');

const browser = await puppeteer.launch({ 
  headless: false,
  devtools: true 
});

const page = await browser.newPage();

// Capture console logs (ignore favicon 404s)
page.on('console', msg => {
  if (!msg.text().includes('favicon') && !msg.text().includes('404')) {
    console.log(`📱 Browser: ${msg.text()}`);
  }
});

// Navigate to the deployed chat demo
console.log('🌐 Navigating to https://sigma-sockets.onrender.com...');
await page.goto('https://sigma-sockets.onrender.com');

// Wait for page to load
console.log('⏳ Waiting for page to load...');
await page.waitForSelector('input[type="text"]', { timeout: 10000 });

// Wait for connection
console.log('⏳ Waiting for WebSocket connection...');
await page.waitForFunction(() => {
  const status = window.connectionStatus;
  console.log(`Current connection status: ${status}`);
  return status === 'connected';
}, { timeout: 15000 });

console.log('✅ Connected! Sending test message...');

// Send a test message
await page.evaluate(() => {
  const input = document.querySelector('input[type="text"]');
  const button = document.querySelector('button[type="submit"]');
  
  if (input && button) {
    input.value = 'FlatBuffers test message from Puppeteer';
    button.click();
  }
});

// Wait a moment for the message to be sent
await new Promise(resolve => setTimeout(resolve, 3000));

console.log('🏁 Test completed - check browser console for FlatBuffers debug output');

// Keep browser open for a bit to see results
await new Promise(resolve => setTimeout(resolve, 5000));

await browser.close();

console.log('✅ Test finished!');
