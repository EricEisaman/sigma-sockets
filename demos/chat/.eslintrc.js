import { defineConfig } from 'eslint';

export default defineConfig({
  extends: ['../../.eslintrc.js'],
  env: {
    browser: true,
    node: true, // Chat demo has both client and server code
  },
  rules: {
    // Demo-specific rules
    'no-console': 'warn', // Allow console in demo code
  },
});

