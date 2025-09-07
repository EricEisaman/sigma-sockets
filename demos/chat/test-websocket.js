#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testWebSocket() {
  console.log('🚀 Starting automated WebSocket test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`📱 Browser: ${msg.text()}`);
  });
  
  // Enable network logging
  page.on('request', request => {
    if (request.url().includes('websocket') || request.url().includes('ws://') || request.url().includes('wss://')) {
      console.log(`🔌 WebSocket Request: ${request.url()}`);
    }
  });
  
  try {
    console.log('🌐 Navigating to chat demo...');
    await page.goto('https://sigma-sockets.onrender.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForSelector('#app', { timeout: 10000 });
    
    console.log('⏳ Waiting for WebSocket connection...');
    await page.waitForFunction(() => {
      return window.connectionStatus === 'connected';
    }, { timeout: 15000 });
    
    console.log('✅ WebSocket connected!');
    
    // Wait a bit for the connection to stabilize
    await page.waitForTimeout(2000);
    
    console.log('📤 Sending test message...');
    
    // Type a test message
    await page.type('input[placeholder*="message"]', 'Automated test message from Puppeteer!');
    
    // Click send button
    await page.click('button[icon="mdi-send"]');
    
    console.log('⏳ Waiting for message to be sent...');
    await page.waitForTimeout(3000);
    
    // Check if the message appears in the chat
    const messages = await page.$$eval('.v-list-item', items => {
      return items.map(item => item.textContent).filter(text => text.includes('Automated test message'));
    });
    
    if (messages.length > 0) {
      console.log('✅ Message sent successfully!');
      console.log('📝 Message content:', messages[0]);
    } else {
      console.log('❌ Message not found in chat');
    }
    
    // Check for any error messages
    const errorMessages = await page.$$eval('.v-alert', alerts => {
      return alerts.map(alert => alert.textContent);
    });
    
    if (errorMessages.length > 0) {
      console.log('⚠️ Error messages found:', errorMessages);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'websocket-test-result.png', fullPage: true });
    console.log('📸 Screenshot saved as websocket-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'websocket-test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as websocket-test-error.png');
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
}

// Run the test
testWebSocket().catch(console.error);
