#!/usr/bin/env node

import PowerfulCompletionDetector from './powerful-completion-detector.js';
import fs from 'fs';

const detector = new PowerfulCompletionDetector();

// Read the test text from file
const testFile = 'test-completion.txt';

try {
  const text = fs.readFileSync(testFile, 'utf8');
  console.log('🎯 TESTING COMPLETION DETECTION...');
  console.log(`📄 Reading from: ${testFile}`);
  console.log(`📝 Text: "${text.trim()}"`);
  
  await detector.checkAndTrigger(text);
} catch (error) {
  console.error('❌ Error reading test file:', error.message);
}
