import { defineConfig } from 'eslint';

export default defineConfig({
  extends: ['../../.eslintrc.js'],
  env: {
    node: true,
    browser: true,
  },
  rules: {
    // Types package specific rules
    'no-console': 'off', // Allow console in type definitions
    '@typescript-eslint/no-explicit-any': 'warn', // Allow any in type definitions
    '@typescript-eslint/no-unused-vars': 'off', // Allow unused vars in type definitions
  },
});
