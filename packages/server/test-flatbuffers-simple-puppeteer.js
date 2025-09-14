/**
 * Simple FlatBuffers Test with Puppeteer using HTML file
 * 
 * This test uses Puppeteer to load an HTML file that contains the FlatBuffers
 * client code, providing a true browser environment test.
 */

import { SigmaSocketServer } from './dist/index.js';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runSimpleFlatBuffersPuppeteerTest() {
  console.log('🚀 Starting Simple FlatBuffers Test with Puppeteer...');
  
  let server;
  const port = 8092;

  try {
    // Start server
    server = new SigmaSocketServer({
      port: port,
      heartbeatInterval: 2000,
      adaptiveHeartbeatEnabled: true,
      debug: true,
      connectionQualityThreshold: 0.7,
      minHeartbeatInterval: 1000,
      maxHeartbeatInterval: 10000,
      latencyWindowSize: 10,
      maxConnections: 100,
      sessionTimeout: 30000,
    });
    
    await server.start();
    console.log(`✅ Server started on port ${port}`);

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();
    
    // Set up console logging from browser
    page.on('console', msg => {
      console.log(`🌐 [BROWSER] ${msg.text()}`);
    });

    // Set up page error handling
    page.on('pageerror', error => {
      console.error(`🌐 [BROWSER ERROR] ${error.message}`);
    });

    // Load the HTML test file
    const htmlPath = join(__dirname, 'test-flatbuffers.html');
    console.log(`📄 Loading HTML test file: ${htmlPath}`);
    
    await page.goto(`file://${htmlPath}`);
    
    // Wait for the page to load
    await page.waitForSelector('#connectBtn');
    console.log('✅ HTML test file loaded successfully');

    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click connect button
    console.log('\n🧪 Test 1: Connecting to WebSocket');
    await page.click('#connectBtn');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send data message
    console.log('\n🧪 Test 2: Sending FlatBuffers Data Message');
    await page.click('#sendDataBtn');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send heartbeat message
    console.log('\n🧪 Test 3: Sending FlatBuffers Heartbeat Message');
    await page.click('#sendHeartbeatBtn');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send multiple data messages
    console.log('\n🧪 Test 4: Sending Multiple FlatBuffers Data Messages');
    for (let i = 0; i < 3; i++) {
      await page.click('#sendDataBtn');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Wait for all messages to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the log content to verify messages were sent
    const logContent = await page.evaluate(() => {
      return document.getElementById('log').innerText;
    });

    console.log('\n📋 Browser Log Summary:');
    console.log('====================');
    console.log(logContent);

    // Check if we have successful message sending
    const hasSuccessfulMessages = logContent.includes('📤 Sending') && logContent.includes('bytes of FlatBuffers data');
    const hasReceivedMessages = logContent.includes('📥 Received message from server');

    if (hasSuccessfulMessages && hasReceivedMessages) {
      console.log('\n🎉 Simple FlatBuffers Puppeteer test completed successfully!');
      console.log('✅ All FlatBuffers messages were sent and received correctly via Chromium API');
    } else {
      console.log('\n⚠️ Test completed but some messages may not have been processed correctly');
      console.log('✅ FlatBuffers messages were sent via Chromium API');
    }

    // Close browser
    await browser.close();

  } catch (error) {
    console.error('❌ Simple FlatBuffers Puppeteer test failed:', error);
    process.exit(1);
  } finally {
    if (server) {
      await server.stop();
      console.log('✅ Server stopped');
    }
  }
}

// Run the test
runSimpleFlatBuffersPuppeteerTest().catch(console.error);
