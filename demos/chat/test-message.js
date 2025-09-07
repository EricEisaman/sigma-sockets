#!/usr/bin/env node

// Simple test to verify FlatBuffers message creation and parsing

import * as flatbuffers from 'flatbuffers';
import { Message } from './dist/generated/sigma-sockets/message.js';
import { MessageType } from './dist/generated/sigma-sockets/message-type.js';
import { DataMessage } from './dist/generated/sigma-sockets/data-message.js';

console.log('🧪 Testing FlatBuffers message creation and parsing...');

// Create a test message
const chatMessage = {
  username: 'TestUser',
  message: 'Hello World!',
  timestamp: Date.now()
};

console.log('Original message:', chatMessage);

// Create FlatBuffers message
const builder = new flatbuffers.Builder(1024);
const payload = builder.createString(JSON.stringify(chatMessage));

DataMessage.startDataMessage(builder);
DataMessage.addPayload(builder, payload);
const dataMessage = DataMessage.endDataMessage(builder);

Message.startMessage(builder);
Message.addType(builder, MessageType.Data);
Message.addData(builder, dataMessage);
const messageObj = Message.endMessage(builder);

builder.finish(messageObj);
const data = builder.asUint8Array();

console.log('✅ FlatBuffers message created, size:', data.length);

// Parse the message back
const bb = new flatbuffers.ByteBuffer(data);
const parsedMessage = Message.getRootAsMessage(bb);

console.log('Parsed message type:', parsedMessage.type());

if (parsedMessage.type() === MessageType.Data) {
  const parsedDataMessage = parsedMessage.data(new DataMessage());
  if (parsedDataMessage) {
    const payload = parsedDataMessage.payloadArray();
    if (payload) {
      const jsonData = new TextDecoder().decode(payload);
      const parsedChatData = JSON.parse(jsonData);
      console.log('✅ Parsed message:', parsedChatData);
      
      if (parsedChatData.username === chatMessage.username && 
          parsedChatData.message === chatMessage.message) {
        console.log('🎉 Message round-trip successful!');
      } else {
        console.log('❌ Message round-trip failed!');
      }
    }
  }
}
