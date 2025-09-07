import { defineConfig } from 'eslint';

export default defineConfig({
  extends: ['../../.eslintrc.js'],
  env: {
    node: true,
    browser: false,
  },
  rules: {
    // Server-specific rules
    'no-console': 'warn', // Allow console in server code
  },
});

