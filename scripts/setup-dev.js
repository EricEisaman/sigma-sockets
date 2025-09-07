#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

function runCommand(command, description) {
  console.log(`🔧 ${description}...`)
  try {
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${description} completed`)
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message)
    process.exit(1)
  }
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...')
  
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
    
    console.log(`📦 Node.js: ${nodeVersion}`)
    console.log(`📦 NPM: ${npmVersion}`)
    
    // Check if Node.js version is >= 18
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
    if (majorVersion < 18) {
      console.error('❌ Node.js version 18 or higher is required')
      process.exit(1)
    }
    
    console.log('✅ Prerequisites check passed')
  } catch (error) {
    console.error('❌ Failed to check prerequisites:', error.message)
    process.exit(1)
  }
}

function setupDirectories() {
  console.log('📁 Setting up directories...')
  
  const directories = [
    'packages/client/dist',
    'packages/server/dist',
    'demos/chat/dist',
    'apps/benchmark/dist',
    'logs',
    'backups'
  ]
  
  directories.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
      console.log(`  📁 Created: ${dir}`)
    }
  })
  
  console.log('✅ Directory setup completed')
}

function installDependencies() {
  console.log('📦 Installing dependencies...')
  runCommand('npm install', 'Installing root dependencies')
  runCommand('npm install --workspaces', 'Installing workspace dependencies')
}

function buildPackages() {
  console.log('🔨 Building packages...')
  runCommand('npm run build:packages', 'Building client and server packages')
}

function runTests() {
  console.log('🧪 Running tests...')
  runCommand('npm run test:packages', 'Running package tests')
}

function setupGitHooks() {
  console.log('🪝 Setting up Git hooks...')
  
  const preCommitHook = `#!/bin/sh
# Pre-commit hook for SigmaSockets
echo "🔍 Running pre-commit checks..."
npm run precommit
`
  
  const prePushHook = `#!/bin/sh
# Pre-push hook for SigmaSockets
echo "🔍 Running pre-push checks..."
npm run prepush
`
  
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    const gitHooksDir = '.git/hooks'
    if (existsSync('.git')) {
      if (!existsSync(gitHooksDir)) {
        mkdirSync(gitHooksDir, { recursive: true })
      }
      
      fs.writeFileSync(join(gitHooksDir, 'pre-commit'), preCommitHook)
      fs.writeFileSync(join(gitHooksDir, 'pre-push'), prePushHook)
      
      execSync('chmod +x .git/hooks/pre-commit .git/hooks/pre-push')
      console.log('✅ Git hooks setup completed')
    } else {
      console.log('⚠️  Git repository not found, skipping Git hooks setup')
    }
  } catch (error) {
    console.log('⚠️  Git hooks setup failed:', error.message)
  }
}

function showNextSteps() {
  console.log(`
🎉 Development environment setup completed!

Next steps:
  1. Start development: npm run dev
  2. Run chat demo: npm run demo:chat
  3. Run benchmarks: npm run benchmark:run
  4. View help: npm run help

Useful commands:
  npm run qa          - Run quality assurance checks
  npm run clean       - Clean build artifacts
  npm run fresh       - Clean and reinstall everything
  npm run info        - Show project information

Happy coding! 🚀
`)
}

async function main() {
  console.log('🚀 Setting up SigmaSockets development environment...\n')
  
  checkPrerequisites()
  setupDirectories()
  installDependencies()
  buildPackages()
  runTests()
  await setupGitHooks()
  showNextSteps()
}

main().catch(error => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})
