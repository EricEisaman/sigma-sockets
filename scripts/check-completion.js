#!/usr/bin/env node

import PowerfulCompletionDetector from './powerful-completion-detector.js';

const detector = new PowerfulCompletionDetector();

// Get the text from command line arguments
const text = process.argv.slice(2).join(' ');

if (text) {
  console.log('🎯 CHECKING FOR COMPLETION PHRASES...');
  await detector.checkAndTrigger(text);
} else {
  console.log('❌ Please provide text to check');
  console.log('Usage: node scripts/check-completion.js "your text here"');
}
