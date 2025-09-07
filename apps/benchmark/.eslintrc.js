import { defineConfig } from 'eslint';

export default defineConfig({
  extends: ['../../.eslintrc.js'],
  env: {
    node: true,
    browser: false,
  },
  rules: {
    // Benchmark-specific rules
    'no-console': 'off', // Allow console in benchmark code
    '@typescript-eslint/no-explicit-any': 'warn', // Allow any in benchmark code
  },
});

