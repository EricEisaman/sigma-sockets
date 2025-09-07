#!/usr/bin/env node

import { activateForUserRequest } from './auto-activate.js';

console.log('👤 User request detected - activating reminder system...');
activateForUserRequest();

// Keep the process running to maintain activation
process.on('SIGINT', () => {
  console.log('\n🛑 User request activation stopped');
  process.exit(0);
});

// Keep running
await new Promise(() => {});
