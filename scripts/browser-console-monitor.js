#!/usr/bin/env node

import puppeteer from 'puppeteer';

const CHAT_DEMO_URL = 'http://localhost:3000';
const WEBSOCKET_SERVER_URL = 'ws://localhost:8080';

console.log('🔍 Starting Browser Console Monitor for SigmaSockets Chat Demo...');
console.log(`📱 Monitoring: ${CHAT_DEMO_URL}`);
console.log(`🔌 WebSocket Server: ${WEBSOCKET_SERVER_URL}`);
console.log('');

async function monitorBrowserConsole() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser window
    devtools: true,  // Open dev tools
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });

  const page = await browser.newPage();
  
  // Set up console monitoring
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    const timestamp = new Date().toISOString();
    
    // Color coding for different console types
    const colors = {
      'log': '\x1b[36m',     // Cyan
      'info': '\x1b[32m',    // Green
      'warn': '\x1b[33m',    // Yellow
      'error': '\x1b[31m',   // Red
      'debug': '\x1b[35m'    // Magenta
    };
    
    const reset = '\x1b[0m';
    const color = colors[type] || '\x1b[37m'; // White default
    
    console.log(`${color}[${timestamp}] [${type.toUpperCase()}]${reset} ${text}`);
    
    // Special handling for errors
    if (type === 'error') {
      console.log(`\n🚨 ERROR DETECTED: ${text}`);
      console.log('🔧 This might need fixing in the code!\n');
    }
  });

  // Set up page error monitoring
  page.on('pageerror', (error) => {
    console.log(`\n💥 PAGE ERROR: ${error.message}`);
    console.log(`📍 Stack: ${error.stack}\n`);
  });

  // Set up request monitoring
  page.on('requestfailed', (request) => {
    console.log(`\n❌ REQUEST FAILED: ${request.url()}`);
    console.log(`📝 Reason: ${request.failure().errorText}\n`);
  });

  // Set up WebSocket monitoring
  await page.evaluateOnNewDocument(() => {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      console.log(`🔌 WebSocket connecting to: ${url}`);
      const ws = new originalWebSocket(url, protocols);
      
      ws.addEventListener('open', () => {
        console.log('✅ WebSocket connected successfully');
      });
      
      ws.addEventListener('close', (event) => {
        console.log(`🔌 WebSocket closed: code=${event.code}, reason=${event.reason}`);
      });
      
      ws.addEventListener('error', (event) => {
        console.log('❌ WebSocket error:', event);
      });
      
      ws.addEventListener('message', (event) => {
        console.log('📨 WebSocket message received:', event.data);
      });
      
      return ws;
    };
  });

  try {
    console.log('🌐 Navigating to chat demo...');
    await page.goto(CHAT_DEMO_URL, { waitUntil: 'networkidle0' });
    
    console.log('✅ Page loaded successfully!');
    console.log('👀 Monitoring console output...');
    console.log('💡 Try opening multiple tabs to test multiplayer chat!');
    console.log('🛑 Press Ctrl+C to stop monitoring\n');
    
    // Keep the browser open and monitor
    await new Promise(() => {}); // Keep running indefinitely
    
  } catch (error) {
    console.error('❌ Failed to load page:', error.message);
    console.log('🔧 Make sure the Vite dev server is running on port 3000');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down browser console monitor...');
  process.exit(0);
});

// Start monitoring
monitorBrowserConsole().catch(console.error);
