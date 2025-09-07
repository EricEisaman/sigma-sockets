#!/usr/bin/env node

import puppeteer from 'puppeteer';

console.log('🚀 Manual FlatBuffers test - just send a message and capture logs...');

const browser = await puppeteer.launch({ 
  headless: false,
  devtools: true 
});

const page = await browser.newPage();

// Capture ALL console logs
page.on('console', msg => {
  console.log(`📱 Browser: ${msg.text()}`);
});

// Navigate to the deployed chat demo
console.log('🌐 Navigating to https://sigma-sockets.onrender.com...');
await page.goto('https://sigma-sockets.onrender.com');

// Wait for page to load
console.log('⏳ Waiting for page to load...');
await page.waitForSelector('input[type="text"]', { timeout: 10000 });

console.log('✅ Page loaded! Now manually send a message in the browser...');
console.log('📝 Type a message and click send, then check the console output below...');

// Keep browser open for manual testing
console.log('🔍 Browser will stay open for 30 seconds for manual testing...');
await new Promise(resolve => setTimeout(resolve, 30000));

await browser.close();

console.log('✅ Test finished!');
