#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

console.log('🚀 Starting FlatBuffers test...');

// Start the server
console.log('🔧 Starting chat server...');
const server = spawn('node', ['dist/chat-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
});

server.stdout.on('data', (data) => {
  console.log(`📡 Server: ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.log(`❌ Server Error: ${data.toString().trim()}`);
});

// Wait for server to start
await new Promise(resolve => setTimeout(resolve, 3000));

// Test with Puppeteer
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
await page.goto('http://localhost:3002');

// Wait for connection
console.log('⏳ Waiting for WebSocket connection...');
await page.waitForFunction(() => {
  return window.connectionStatus === 'connected';
}, { timeout: 10000 });

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
await new Promise(resolve => setTimeout(resolve, 2000));

console.log('🏁 Test completed - check server logs for FlatBuffers debug output');

// Clean up
await browser.close();
server.kill();

console.log('✅ Test finished!');
