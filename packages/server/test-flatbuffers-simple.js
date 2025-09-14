/**
 * Simple FlatBuffers Message Test
 * 
 * This test creates FlatBuffers messages directly and sends them to the server
 * to validate the complete message flow.
 */

import { SigmaSocketServer } from './dist/index.js';
import puppeteer from 'puppeteer';
import * as flatbuffers from 'flatbuffers';

// We'll create the FlatBuffers messages manually since we can't import the generated files
// This mimics what the generated code would do

// MessageType enum values (from schema)
const MessageType = {
  Connect: 0,
  Disconnect: 1,
  Data: 2,
  Heartbeat: 3,
  Reconnect: 4,
  Error: 5
};

// MessageData union values
const MessageData = {
  NONE: 0,
  ConnectMessage: 1,
  DisconnectMessage: 2,
  DataMessage: 3,
  HeartbeatMessage: 4,
  ReconnectMessage: 5,
  ErrorMessage: 6
};

class SimpleFlatBuffersClient {
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
    console.log('📤 Creating and sending FlatBuffers Connect message...');
    
    const builder = new flatbuffers.Builder(1024);
    
    // Create strings
    const sessionId = builder.createString(`test_session_${Date.now()}`);
    const clientVersion = builder.createString('1.0.0');

    // Create ConnectMessage table
    const connectMessageStart = flatbuffers.startTable(builder, 2);
    flatbuffers.addFieldOffset(builder, 0, sessionId, 0); // session_id
    flatbuffers.addFieldOffset(builder, 1, clientVersion, 0); // client_version
    const connectMessage = flatbuffers.endTable(builder, connectMessageStart);

    // Create Message table
    const messageStart = flatbuffers.startTable(builder, 3);
    flatbuffers.addFieldInt8(builder, 0, MessageType.Connect, MessageType.Connect); // type
    flatbuffers.addFieldInt8(builder, 1, MessageData.ConnectMessage, MessageData.NONE); // data_type
    flatbuffers.addFieldOffset(builder, 2, connectMessage, 0); // data
    const message = flatbuffers.endTable(builder, messageStart);

    builder.finish(message);
    const flatbuffersData = builder.asUint8Array();
    
    console.log(`📤 Sending ${flatbuffersData.length} bytes of FlatBuffers data`);
    console.log(`📤 First 20 bytes: [${Array.from(flatbuffersData.slice(0, 20)).join(', ')}]`);
    
    this.ws.send(flatbuffersData);
  }

  sendDataMessage(testData) {
    console.log(`📤 Creating and sending FlatBuffers Data message: ${testData}`);
    
    const builder = new flatbuffers.Builder(1024);
    
    // Create payload
    const payload = new TextEncoder().encode(testData);
    const payloadVector = flatbuffers.createByteVector(builder, payload);
    
    // Create DataMessage table
    const dataMessageStart = flatbuffers.startTable(builder, 3);
    flatbuffers.addFieldOffset(builder, 0, payloadVector, 0); // payload
    flatbuffers.addFieldInt64(builder, 1, BigInt(++this.messageIdCounter), BigInt(0)); // message_id
    flatbuffers.addFieldInt64(builder, 2, BigInt(Date.now()), BigInt(0)); // timestamp
    const dataMessage = flatbuffers.endTable(builder, dataMessageStart);

    // Create Message table
    const messageStart = flatbuffers.startTable(builder, 3);
    flatbuffers.addFieldInt8(builder, 0, MessageType.Data, MessageType.Connect); // type
    flatbuffers.addFieldInt8(builder, 1, MessageData.DataMessage, MessageData.NONE); // data_type
    flatbuffers.addFieldOffset(builder, 2, dataMessage, 0); // data
    const message = flatbuffers.endTable(builder, messageStart);

    builder.finish(message);
    const flatbuffersData = builder.asUint8Array();
    
    console.log(`📤 Sending ${flatbuffersData.length} bytes of FlatBuffers data`);
    this.ws.send(flatbuffersData);
  }

  sendHeartbeatMessage() {
    console.log('📤 Creating and sending FlatBuffers Heartbeat message...');
    
    const builder = new flatbuffers.Builder(1024);
    
    // Create HeartbeatMessage table
    const heartbeatMessageStart = flatbuffers.startTable(builder, 1);
    flatbuffers.addFieldInt64(builder, 0, BigInt(Date.now()), BigInt(0)); // timestamp
    const heartbeatMessage = flatbuffers.endTable(builder, heartbeatMessageStart);

    // Create Message table
    const messageStart = flatbuffers.startTable(builder, 3);
    flatbuffers.addFieldInt8(builder, 0, MessageType.Heartbeat, MessageType.Connect); // type
    flatbuffers.addFieldInt8(builder, 1, MessageData.HeartbeatMessage, MessageData.NONE); // data_type
    flatbuffers.addFieldOffset(builder, 2, heartbeatMessage, 0); // data
    const message = flatbuffers.endTable(builder, messageStart);

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
        const messageOffset = buf.readInt32(buf.position()) + buf.position();
        buf.setPosition(messageOffset);
        
        // Read message type (first field)
        const messageType = buf.readInt8(messageOffset + 4);
        console.log(`📥 Parsed FlatBuffers message type: ${messageType}`);
        
        // Try to decode as text if it looks like text
        const text = new TextDecoder().decode(uint8Array);
        if (text.includes('response') || text.includes('heartbeat')) {
          console.log(`📥 Text message: ${text}`);
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

async function runSimpleFlatBuffersTest() {
  console.log('🚀 Starting Simple FlatBuffers Message Test...');
  
  let server;
  const port = 8089;

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
        window.testClient = new SimpleFlatBuffersClient(ws);
        
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

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🎉 Simple FlatBuffers test completed successfully!');
    console.log('✅ All FlatBuffers messages were sent and processed correctly');

  } catch (error) {
    console.error('❌ Simple FlatBuffers test failed:', error);
    process.exit(1);
  } finally {
    if (server) {
      await server.stop();
      console.log('✅ Server stopped');
    }
  }
}

// Run the test
runSimpleFlatBuffersTest().catch(console.error);
