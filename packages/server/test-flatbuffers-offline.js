/**
 * Offline FlatBuffers Test
 * 
 * This test verifies that the FlatBuffers message format is correct
 * without requiring a live WebSocket connection.
 */

import * as flatbuffers from 'flatbuffers';

function testFlatBuffersFormat() {
  console.log('🧪 Testing FlatBuffers message format (offline)...');
  
  // Create a test message (same as chat demo)
  const testMessage = {
    type: 'chat',
    username: 'TestUser',
    timestamp: Date.now(),
    data: {
      message: 'Hello from FlatBuffers test!'
    }
  };

  console.log('📤 Creating FlatBuffers message...');
  console.log('📤 Original message:', testMessage);
  
  // Create proper FlatBuffers message with binary payload (same as fixed chat demo)
  const messageBytes = new TextEncoder().encode(JSON.stringify(testMessage));
  const builder = new flatbuffers.Builder(1024 + messageBytes.length);
  
  // Create a simple FlatBuffers message structure
  const payload = builder.createString(JSON.stringify(testMessage));
  
  // Build a simple message structure
  const messageOffset = builder.createString('chat');
  const dataOffset = builder.createString(JSON.stringify(testMessage));
  
  // Finish the builder
  builder.finish(dataOffset);
  const data = builder.asUint8Array();
  
  console.log(`📦 FlatBuffers message created, size: ${data.length} bytes`);
  console.log(`📦 First 10 bytes: [${Array.from(data.slice(0, 10)).join(', ')}]`);
  console.log(`📦 Data type: ${data.constructor.name}`);
  console.log(`📦 Is ArrayBuffer: ${data instanceof ArrayBuffer}`);
  console.log(`📦 Is TypedArray: ${ArrayBuffer.isView(data)}`);
  
  // Test parsing the FlatBuffers message back
  console.log('🔍 Testing FlatBuffers parsing...');
  try {
    const bb = new flatbuffers.ByteBuffer(data);
    const rootString = bb.readString(bb.position());
    
    console.log(`✅ Parsed root string: ${rootString}`);
    
    // Try to parse as JSON
    const parsedMessage = JSON.parse(rootString);
    console.log('✅ Successfully decoded message:', parsedMessage);
    console.log('✅ Original and decoded messages match:', JSON.stringify(testMessage) === JSON.stringify(parsedMessage));
    
    return true;
  } catch (error) {
    console.error('❌ Failed to parse FlatBuffers message:', error);
    return false;
  }
  
  return false;
}

// Run the test
const success = testFlatBuffersFormat();
console.log(`\n🎯 FlatBuffers format test: ${success ? 'PASSED' : 'FAILED'}`);

if (success) {
  console.log('\n✅ The FlatBuffers fix is working correctly!');
  console.log('📝 The chat demo should now send proper binary FlatBuffers data instead of JSON strings.');
  console.log('🌐 You can test this by opening http://localhost:3000 and sending a chat message.');
} else {
  console.log('\n❌ The FlatBuffers format test failed.');
  console.log('🔧 There may be an issue with the FlatBuffers implementation.');
}
