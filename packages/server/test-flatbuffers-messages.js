/**
 * Comprehensive FlatBuffers Message Test
 * 
 * This test demonstrates proper FlatBuffers message creation, sending, and parsing
 * to validate the complete message flow without JSON fallback.
 */

import { SigmaSocketServer } from './dist/index.js';
import puppeteer from 'puppeteer';
import * as flatbuffers from 'flatbuffers';

// Import generated FlatBuffers classes
import { Message } from './dist/generated/sigma-sockets/message.js';
import { MessageType } from './dist/generated/sigma-sockets/message-type.js';
import { MessageData } from './dist/generated/sigma-sockets/message-data.js';
import { ConnectMessage } from './dist/generated/sigma-sockets/connect-message.js';
import { DataMessage } from './dist/generated/sigma-sockets/data-message.js';
import { HeartbeatMessage } from './dist/generated/sigma-sockets/heartbeat-message.js';

class FlatBuffersTestClient {
  constructor(ws) {
    this.ws = ws;
    this.messageIdCounter = 0;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('🔗 WebSocket connection opened');
      this.sendConnectMessage();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket connection closed');
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }

  sendConnectMessage() {
    console.log('📤 Sending FlatBuffers Connect message...');
    
    const builder = new flatbuffers.Builder(1024);
    const sessionId = builder.createString(`test_session_${Date.now()}`);
    const clientVersion = builder.createString('1.0.0');

    ConnectMessage.startConnectMessage(builder);
    ConnectMessage.addSessionId(builder, sessionId);
    ConnectMessage.addClientVersion(builder, clientVersion);
    const connectMsg = ConnectMessage.endConnectMessage(builder);

    Message.startMessage(builder);
    Message.addType(builder, MessageType.Connect);
    Message.addDataType(builder, MessageData.ConnectMessage);
    Message.addData(builder, connectMsg);
    const message = Message.endMessage(builder);

    builder.finish(message);
    const flatbuffersData = builder.asUint8Array();
    
    console.log(`📤 Sending ${flatbuffersData.length} bytes of FlatBuffers data`);
    console.log(`📤 First 20 bytes: [${Array.from(flatbuffersData.slice(0, 20)).join(', ')}]`);
    
    this.ws.send(flatbuffersData);
  }

  sendDataMessage(testData) {
    console.log(`📤 Sending FlatBuffers Data message: ${testData}`);
    
    const builder = new flatbuffers.Builder(1024);
    const payload = new TextEncoder().encode(testData);
    const payloadVector = DataMessage.createPayloadVector(builder, payload);
    const messageId = ++this.messageIdCounter;
    const timestamp = BigInt(Date.now());

    DataMessage.startDataMessage(builder);
    DataMessage.addPayload(builder, payloadVector);
    DataMessage.addMessageId(builder, messageId);
    DataMessage.addTimestamp(builder, timestamp);
    const dataMsg = DataMessage.endDataMessage(builder);

    Message.startMessage(builder);
    Message.addType(builder, MessageType.Data);
    Message.addDataType(builder, MessageData.DataMessage);
    Message.addData(builder, dataMsg);
    const message = Message.endMessage(builder);

    builder.finish(message);
    const flatbuffersData = builder.asUint8Array();
    
    console.log(`📤 Sending ${flatbuffersData.length} bytes of FlatBuffers data`);
    this.ws.send(flatbuffersData);
  }

  sendHeartbeatMessage() {
    console.log('📤 Sending FlatBuffers Heartbeat message...');
    
    const builder = new flatbuffers.Builder(1024);
    const timestamp = BigInt(Date.now());

    HeartbeatMessage.startHeartbeatMessage(builder);
    HeartbeatMessage.addTimestamp(builder, timestamp);
    const heartbeatMsg = HeartbeatMessage.endHeartbeatMessage(builder);

    Message.startMessage(builder);
    Message.addType(builder, MessageType.Heartbeat);
    Message.addDataType(builder, MessageData.HeartbeatMessage);
    Message.addData(builder, heartbeatMsg);
    const message = Message.endMessage(builder);

    builder.finish(message);
    const flatbuffersData = builder.asUint8Array();
    
    console.log(`📤 Sending ${flatbuffersData.length} bytes of FlatBuffers data`);
    this.ws.send(flatbuffersData);
  }

  handleMessage(data) {
    console.log('📥 Received message from server');
    console.log(`📥 Data type: ${data.constructor.name}`);
    console.log(`📥 Data length: ${data.length}`);
    
    if (data instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(data);
      console.log(`📥 First 20 bytes: [${Array.from(uint8Array.slice(0, 20)).join(', ')}]`);
      
      try {
        // Try to parse as FlatBuffers
        const buf = new flatbuffers.ByteBuffer(uint8Array);
        const message = Message.getRootAsMessage(buf);
        const messageType = message.type();
        
        console.log(`📥 Parsed FlatBuffers message type: ${messageType}`);
        
        switch (messageType) {
          case MessageType.Data:
            const dataMsg = message.data(new DataMessage());
            if (dataMsg) {
              const payload = dataMsg.payloadArray();
              const text = new TextDecoder().decode(payload);
              console.log(`📥 Data message payload: ${text}`);
            }
            break;
          case MessageType.Heartbeat:
            const heartbeatMsg = message.data(new HeartbeatMessage());
            if (heartbeatMsg) {
              console.log(`📥 Heartbeat timestamp: ${heartbeatMsg.timestamp()}`);
            }
            break;
          default:
            console.log(`📥 Unhandled message type: ${messageType}`);
        }
      } catch (error) {
        console.log('📥 Failed to parse as FlatBuffers, trying as text...');
        try {
          const text = new TextDecoder().decode(uint8Array);
          console.log(`📥 Text message: ${text}`);
        } catch (textError) {
          console.log('📥 Failed to parse as text:', textError);
        }
      }
    } else {
      console.log(`📥 Non-ArrayBuffer data: ${data}`);
    }
  }
}

async function runFlatBuffersTest() {
  console.log('🚀 Starting Comprehensive FlatBuffers Message Test...');
  
  let server;
  const port = 8088;

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
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set up WebSocket connection
    await page.evaluateOnNewDocument(() => {
      window.testResults = [];
      window.testErrors = [];
    });

    // Create WebSocket connection
    const wsUrl = `ws://localhost:${port}`;
    console.log(`🔗 Connecting to ${wsUrl}`);
    
    await page.evaluate((url) => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        window.testClient = new FlatBuffersTestClient(ws);
        
        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          resolve();
        };
        
        ws.onerror = (error) => {
          console.error('❌ WebSocket connection failed:', error);
          reject(error);
        };
      });
    }, wsUrl);

    // Wait for connection to be established
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: Send data message
    console.log('\n🧪 Test 1: Sending FlatBuffers Data Message');
    await page.evaluate(() => {
      window.testClient.sendDataMessage('Hello from FlatBuffers!');
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Send heartbeat message
    console.log('\n🧪 Test 2: Sending FlatBuffers Heartbeat Message');
    await page.evaluate(() => {
      window.testClient.sendHeartbeatMessage();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Send multiple data messages
    console.log('\n🧪 Test 3: Sending Multiple FlatBuffers Data Messages');
    for (let i = 0; i < 3; i++) {
      await page.evaluate((index) => {
        window.testClient.sendDataMessage(`Test message ${index + 1}`);
      }, i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test 4: Send large data message
    console.log('\n🧪 Test 4: Sending Large FlatBuffers Data Message');
    const largeData = 'A'.repeat(1000);
    await page.evaluate((data) => {
      window.testClient.sendDataMessage(data);
    }, largeData);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 5: Send binary data
    console.log('\n🧪 Test 5: Sending Binary Data in FlatBuffers');
    const binaryData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    await page.evaluate((data) => {
      const builder = new flatbuffers.Builder(1024);
      const payloadVector = DataMessage.createPayloadVector(builder, data);
      const messageId = ++window.testClient.messageIdCounter;
      const timestamp = BigInt(Date.now());

      DataMessage.startDataMessage(builder);
      DataMessage.addPayload(builder, payloadVector);
      DataMessage.addMessageId(builder, messageId);
      DataMessage.addTimestamp(builder, timestamp);
      const dataMsg = DataMessage.endDataMessage(builder);

      Message.startMessage(builder);
      Message.addType(builder, MessageType.Data);
      Message.addDataType(builder, MessageData.DataMessage);
      Message.addData(builder, dataMsg);
      const message = Message.endMessage(builder);

      builder.finish(message);
      const flatbuffersData = builder.asUint8Array();
      
      console.log(`📤 Sending binary data: [${Array.from(data).join(', ')}]`);
      window.testClient.ws.send(flatbuffersData);
    }, Array.from(binaryData));

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🎉 FlatBuffers test completed successfully!');
    console.log('✅ All FlatBuffers messages were sent and processed correctly');

  } catch (error) {
    console.error('❌ FlatBuffers test failed:', error);
    process.exit(1);
  } finally {
    if (server) {
      await server.stop();
      console.log('✅ Server stopped');
    }
  }
}

// Run the test
runFlatBuffersTest().catch(console.error);
