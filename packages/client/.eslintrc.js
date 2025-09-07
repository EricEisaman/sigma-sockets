import { defineConfig } from 'eslint';

export default defineConfig({
  extends: ['../../.eslintrc.js'],
  env: {
    browser: true,
    node: false,
  },
  rules: {
    // Client-specific rules
    'no-process-env': 'error',
    'no-process-exit': 'error',
  },
});

