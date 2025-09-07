# Linting and Formatting Guide

This document provides comprehensive information about the linting and formatting setup for the SigmaSockets monorepo.

## 🔧 Configuration Files

### ESLint Configuration
- **Root**: `.eslintrc.js` - Main configuration with TypeScript rules
- **Client**: `packages/client/.eslintrc.js` - Browser-specific rules
- **Server**: `packages/server/.eslintrc.js` - Node.js-specific rules
- **Chat Demo**: `demos/chat/.eslintrc.js` - Demo-specific rules
- **Benchmark**: `apps/benchmark/.eslintrc.js` - Benchmark-specific rules

### Prettier Configuration
- **Root**: `.prettierrc.js` - Main formatting configuration
- **Ignore**: `.prettierignore` - Files to exclude from formatting

## 📋 Available Commands

### Linting
```bash
# Lint all files
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Lint specific workspace
npm run lint --workspace=packages/client
npm run lint --workspace=packages/server
```

### Formatting
```bash
# Format all files
npm run format

# Check formatting without fixing
npm run format:check

# Format specific workspace
npm run format --workspace=packages/client
```

### Combined Quality Checks
```bash
# Quick quality check (type-check + lint)
npm run qa:quick

# Full quality check (type-check + lint + test + build)
npm run qa

# CI quality check (clean + install + qa)
npm run ci
```

## 🎯 ESLint Rules Overview

### Core ESLint Rules
- **Error Prevention**: `no-console`, `no-debugger`, `no-alert`
- **Modern JavaScript**: `no-var`, `prefer-const`, `prefer-arrow-callback`
- **Code Quality**: `no-unused-expressions`, `no-unreachable`, `no-useless-*`
- **Performance**: `no-await-in-loop`, `no-promise-executor-return`

### TypeScript-Specific Rules
- **Type Safety**: `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unsafe-*`
- **Modern TypeScript**: `@typescript-eslint/prefer-nullish-coalescing`, `@typescript-eslint/prefer-optional-chain`
- **Code Quality**: `@typescript-eslint/explicit-module-boundary-types`, `@typescript-eslint/require-await`
- **Best Practices**: `@typescript-eslint/consistent-type-imports`, `@typescript-eslint/prefer-as-const`

### Code Style Rules
- **Formatting**: Integrated with Prettier
- **Spacing**: `array-bracket-spacing`, `object-curly-spacing`, `comma-spacing`
- **Line Length**: `max-len: 120`
- **Quotes**: `single` quotes preferred
- **Semicolons**: `always` required

## 🎨 Prettier Configuration

### Formatting Rules
```javascript
{
  printWidth: 120,           // Maximum line length
  tabWidth: 2,               // Indentation size
  useTabs: false,            // Use spaces instead of tabs
  semi: true,                // Add semicolons
  singleQuote: true,         // Use single quotes
  trailingComma: 'all',      // Add trailing commas
  bracketSpacing: true,      // Spaces in object literals
  arrowParens: 'avoid',      // Avoid parentheses around single arrow function parameters
  proseWrap: 'preserve',     // Don't wrap prose
  endOfLine: 'lf',           // Unix line endings
}
```

### Ignored Files
- `node_modules/` - Dependencies
- `dist/`, `build/` - Build outputs
- `*.min.js`, `*.bundle.js` - Minified files
- `coverage/` - Test coverage
- `*.log` - Log files
- `package-lock.json`, `yarn.lock` - Lock files
- `*.d.ts` - TypeScript declaration files

## 🔍 Workspace-Specific Rules

### Client Package (`packages/client`)
- **Environment**: Browser only
- **Restrictions**: No Node.js APIs (`process`, `require`)
- **Console**: Error (use proper logging)

### Server Package (`packages/server`)
- **Environment**: Node.js only
- **Console**: Warning (acceptable for server logging)
- **Node APIs**: Allowed

### Chat Demo (`demos/chat`)
- **Environment**: Both browser and Node.js
- **Console**: Warning (acceptable for demo)
- **Flexibility**: More relaxed rules for demonstration

### Benchmark App (`apps/benchmark`)
- **Environment**: Node.js only
- **Console**: Off (benchmarks need console output)
- **TypeScript**: Relaxed `any` usage for performance testing

## 🚨 Common Issues and Solutions

### TypeScript Errors
```bash
# Fix type issues
npm run type-check

# Auto-fix linting issues
npm run lint:fix
```

### Formatting Issues
```bash
# Auto-format all files
npm run format

# Check what would be formatted
npm run format:check
```

### Import/Export Issues
```typescript
// ✅ Good - Type-only imports
import type { SomeType } from './types';
import { someFunction } from './utils';

// ❌ Bad - Mixed imports
import { SomeType, someFunction } from './module';
```

### Console Usage
```typescript
// ✅ Good - Server code
console.log('Server started on port 8080');

// ❌ Bad - Client code (use proper logging)
console.log('User clicked button');
```

## 🔧 IDE Integration

### VS Code
Install these extensions:
- **ESLint** - Real-time linting
- **Prettier** - Code formatting
- **TypeScript Importer** - Auto-imports

### Settings (`.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["typescript", "javascript"],
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### WebStorm/IntelliJ
- Enable ESLint integration
- Set Prettier as code formatter
- Enable "Format on save"

## 📊 Quality Metrics

### Linting Metrics
- **Error Count**: Should be 0
- **Warning Count**: Minimize warnings
- **Rule Coverage**: 100% of codebase

### Formatting Metrics
- **Consistency**: All files follow same style
- **Line Length**: Max 120 characters
- **Indentation**: 2 spaces consistently

## 🚀 Pre-commit Hooks

The project includes pre-commit hooks that run:
1. **Type Checking**: `npm run type-check`
2. **Linting**: `npm run lint`
3. **Formatting Check**: `npm run format:check`

### Bypassing Hooks (Emergency Only)
```bash
git commit --no-verify -m "Emergency fix"
```

## 🔄 Continuous Integration

### GitHub Actions / CI Pipeline
```yaml
- name: Lint and Format Check
  run: |
    npm run lint
    npm run format:check
    npm run type-check
```

### Local CI Simulation
```bash
# Run same checks as CI
npm run ci
```

## 📚 Best Practices

### Code Quality
1. **Fix linting errors immediately**
2. **Use TypeScript strict mode**
3. **Prefer type-safe code**
4. **Avoid `any` type**
5. **Use proper error handling**

### Formatting
1. **Format before committing**
2. **Use consistent naming**
3. **Keep lines under 120 characters**
4. **Use meaningful variable names**
5. **Add proper comments**

### Performance
1. **Avoid console.log in production**
2. **Use proper logging libraries**
3. **Optimize imports**
4. **Remove unused code**

## 🆘 Troubleshooting

### Common Problems

#### ESLint Not Working
```bash
# Reinstall dependencies
npm run fresh

# Check ESLint version
npx eslint --version
```

#### Prettier Conflicts
```bash
# Clear cache
npm run clean

# Reformat everything
npm run format
```

#### TypeScript Errors
```bash
# Check TypeScript version
npx tsc --version

# Rebuild types
npm run build
```

### Getting Help
- Check ESLint documentation: https://eslint.org/
- Check Prettier documentation: https://prettier.io/
- Check TypeScript documentation: https://www.typescriptlang.org/
- Run `npm run help` for available commands

