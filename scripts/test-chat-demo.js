#!/usr/bin/env node

import puppeteer from 'puppeteer';

const CHAT_DEMO_URL = 'http://localhost:3000';

console.log('🧪 Testing SigmaSockets Chat Demo...');

async function testChatDemo() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Collect all console messages
  const consoleMessages = [];
  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
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
    
    // Wait for the page to load and initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if the chat demo loaded successfully
    const statusElement = await page.$('#status');
    if (statusElement) {
      const statusText = await page.evaluate(el => el.textContent, statusElement);
      console.log(`📊 Connection Status: ${statusText}`);
    }
    
    // Check for any error messages
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    if (errorMessages.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errorMessages.forEach(error => {
        console.log(`  - ${error.text}`);
      });
    }
    
    // Check for page errors
    if (pageErrors.length > 0) {
      console.log('\n💥 PAGE ERRORS:');
      pageErrors.forEach(error => {
        console.log(`  - ${error.message}`);
      });
    }
    
    // Try to send a test message
    console.log('\n💬 Testing message sending...');
    const messageInput = await page.$('#messageInput');
    const sendButton = await page.$('#sendButton');
    
    if (messageInput && sendButton) {
      await messageInput.type('Hello from automated test!');
      await sendButton.click();
      console.log('✅ Test message sent successfully');
    } else {
      console.log('❌ Could not find message input or send button');
    }
    
    // Wait a bit more to see any responses
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📋 Test Summary:');
    console.log(`  - Console messages: ${consoleMessages.length}`);
    console.log(`  - Errors: ${errorMessages.length}`);
    console.log(`  - Page errors: ${pageErrors.length}`);
    
    if (errorMessages.length === 0 && pageErrors.length === 0) {
      console.log('✅ Chat demo appears to be working correctly!');
    } else {
      console.log('❌ Chat demo has issues that need fixing');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will remain open for manual inspection...');
    console.log('🛑 Close the browser window when done');
    
    // Wait for user to close browser
    await new Promise(() => {});
  }
}

testChatDemo().catch(console.error);
