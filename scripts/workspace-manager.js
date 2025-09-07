#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

const workspaces = [
  { name: 'types', path: 'packages/types' },
  { name: 'client', path: 'packages/client' },
  { name: 'server', path: 'packages/server' },
  { name: 'chat', path: 'demos/chat' },
  { name: 'benchmark', path: 'apps/benchmark' }
]

function runCommand(command, workspace = null) {
  try {
    if (workspace) {
      const workspacePath = workspaces.find(w => w.name === workspace)?.path
      if (!workspacePath) {
        console.error(`❌ Workspace '${workspace}' not found`)
        process.exit(1)
      }
      execSync(`npm run ${command} --workspace=${workspacePath}`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
    } else {
      execSync(`npm run ${command}`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
    }
  } catch (error) {
    console.error(`❌ Command failed: ${command}`, error.message)
    process.exit(1)
  }
}

function runParallel(commands) {
  const promises = commands.map(cmd => {
    return new Promise((resolve, reject) => {
      try {
        execSync(cmd, { stdio: 'inherit' })
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })
  
  return Promise.all(promises)
}

function getWorkspaceInfo() {
  console.log('📦 Workspace Information:')
  workspaces.forEach(workspace => {
    try {
      const packagePath = join(workspace.path, 'package.json')
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
      console.log(`  ${workspace.name}: ${packageJson.version} (${workspace.path})`)
    } catch (error) {
      console.log(`  ${workspace.name}: ❌ Error reading package.json`)
    }
  })
}

function showHelp() {
  console.log(`
🚀 SigmaSockets Workspace Manager

Usage: node scripts/workspace-manager.js <command> [options]

Commands:
  build [workspace]     - Build specific workspace or all
  dev [workspace]       - Start development mode
  test [workspace]      - Run tests
  clean [workspace]     - Clean build artifacts
  info                  - Show workspace information
  help                  - Show this help

Examples:
  node scripts/workspace-manager.js build client
  node scripts/workspace-manager.js dev
  node scripts/workspace-manager.js test server
  node scripts/workspace-manager.js info
`)
}

function main() {
  const [,, command, workspace] = process.argv

  if (!command || command === 'help') {
    showHelp()
    return
  }

  switch (command) {
    case 'build':
      if (workspace) {
        console.log(`🔨 Building ${workspace}...`)
        runCommand('build', workspace)
      } else {
        console.log('🔨 Building all workspaces...')
        runCommand('build')
      }
      break

    case 'dev':
      if (workspace) {
        console.log(`🚀 Starting development mode for ${workspace}...`)
        runCommand('dev', workspace)
      } else {
        console.log('🚀 Starting development mode for all workspaces...')
        runCommand('dev')
      }
      break

    case 'test':
      if (workspace) {
        console.log(`🧪 Running tests for ${workspace}...`)
        runCommand('test', workspace)
      } else {
        console.log('🧪 Running tests for all workspaces...')
        runCommand('test')
      }
      break

    case 'clean':
      if (workspace) {
        console.log(`🧹 Cleaning ${workspace}...`)
        runCommand('clean', workspace)
      } else {
        console.log('🧹 Cleaning all workspaces...')
        runCommand('clean')
      }
      break

    case 'info':
      getWorkspaceInfo()
      break

    default:
      console.error(`❌ Unknown command: ${command}`)
      showHelp()
      process.exit(1)
  }
}

main()
