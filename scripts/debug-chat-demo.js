#!/usr/bin/env node

import puppeteer from 'puppeteer';

const CHAT_DEMO_URL = 'http://localhost:3000';

console.log('🔍 Debugging SigmaSockets Chat Demo...');

async function debugChatDemo() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Monitor network requests
  const networkRequests = [];
  page.on('request', (request) => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      timestamp: new Date().toISOString()
    });
  });

  // Monitor network responses
  const networkResponses = [];
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      networkResponses.push({
        url: response.url(),
        status: status,
        statusText: response.statusText(),
        resourceType: response.request().resourceType(),
        timestamp: new Date().toISOString()
      });
      console.log(`❌ ${status} ${response.statusText()}: ${response.url()}`);
    }
  });

  // Collect console messages
  const consoleMessages = [];
  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    
    if (msg.type() === 'error') {
      console.log(`🚨 [${msg.type().toUpperCase()}] ${msg.text()}`);
    } else {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', (error) => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log(`💥 PAGE ERROR: ${error.message}`);
  });

  try {
    console.log('🌐 Loading chat demo...');
    await page.goto(CHAT_DEMO_URL, { waitUntil: 'networkidle0' });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📊 DEBUG SUMMARY:');
    console.log(`  - Network requests: ${networkRequests.length}`);
    console.log(`  - Failed responses (4xx/5xx): ${networkResponses.length}`);
    console.log(`  - Console messages: ${consoleMessages.length}`);
    console.log(`  - Page errors: ${pageErrors.length}`);
    
    if (networkResponses.length > 0) {
      console.log('\n❌ FAILED NETWORK REQUESTS:');
      networkResponses.forEach(response => {
        console.log(`  - ${response.status} ${response.statusText}: ${response.url}`);
      });
    }
    
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    if (errorMessages.length > 0) {
      console.log('\n🚨 CONSOLE ERRORS:');
      errorMessages.forEach(error => {
        console.log(`  - ${error.text}`);
      });
    }
    
    // Check connection status
    const statusElement = await page.$('#status');
    if (statusElement) {
      const statusText = await page.evaluate(el => el.textContent, statusElement);
      console.log(`\n📡 Connection Status: ${statusText}`);
    }
    
    // Check if we can send messages
    const messageInput = await page.$('#messageInput');
    const sendButton = await page.$('#sendButton');
    
    if (messageInput && sendButton) {
      console.log('\n💬 Testing message functionality...');
      await messageInput.type('Debug test message');
      await sendButton.click();
      console.log('✅ Message sent successfully');
      
      // Wait to see if message appears
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const messagesDiv = await page.$('#messages');
      if (messagesDiv) {
        const messageCount = await page.evaluate(el => el.children.length, messagesDiv);
        console.log(`📝 Messages in chat: ${messageCount}`);
      }
    }
    
    console.log('\n🔍 Debug complete! Browser will remain open for manual inspection...');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    // Keep browser open for manual inspection
    await new Promise(() => {});
  }
}

debugChatDemo().catch(console.error);
