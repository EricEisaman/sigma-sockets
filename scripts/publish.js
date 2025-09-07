#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const packages = ['types', 'client', 'server']
const dryRun = process.argv.includes('--dry-run')
const targetUser = 'sirfizx'
const targetProfile = 'https://www.npmjs.com/~sirfizx'

// Remove --dry-run from arguments to get the version
const args = process.argv.filter(arg => arg !== '--dry-run')

function updateVersion(packageName, version) {
  const packagePath = join('packages', packageName, 'package.json')
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
  
  packageJson.version = version
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')
  
  console.log(`✅ Updated ${packageName} to version ${version}`)
}

function buildPackage(packageName) {
  console.log(`🔨 Building ${packageName}...`)
  execSync(`npm run build:${packageName}`, { stdio: 'inherit' })
}

function publishPackage(packageName) {
  console.log(`📦 Publishing ${packageName}...`)
  
  if (dryRun) {
    console.log(`[DRY RUN] Would publish ${packageName}`)
    return
  }
  
  try {
    execSync(`npm publish --workspace=packages/${packageName}`, { stdio: 'inherit' })
    console.log(`✅ Successfully published ${packageName}`)
  } catch (error) {
    console.error(`❌ Failed to publish ${packageName}:`, error.message)
    process.exit(1)
  }
}

function checkNpmAuthentication() {
  console.log('🔐 Checking npm authentication...')
  
  try {
    const currentUser = execSync('npm whoami', { encoding: 'utf8' }).trim()
    
    if (currentUser === targetUser) {
      console.log(`✅ Authenticated as: ${currentUser}`)
      console.log(`✅ Target profile: ${targetProfile}`)
    } else {
      console.error(`❌ Authentication mismatch!`)
      console.error(`   Current user: ${currentUser}`)
      console.error(`   Expected user: ${targetUser}`)
      console.error(`   Target profile: ${targetProfile}`)
      console.error('')
      console.error('💡 To fix this, run: npm run npm:setup')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Not authenticated with npm')
    console.error('💡 To fix this, run: npm run npm:setup')
    process.exit(1)
  }
}

function main() {
  const version = args[2]
  
  if (!version) {
    console.error('❌ Please provide a version number')
    console.log('Usage: node scripts/publish.js <version> [--dry-run]')
    process.exit(1)
  }
  
  console.log(`🚀 Publishing SigmaSockets packages version ${version}`)
  console.log(`📦 Target profile: ${targetProfile}`)
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No actual publishing will occur')
  }
  
  // Check npm authentication first
  checkNpmAuthentication()
  
  // Update versions
  packages.forEach(packageName => {
    updateVersion(packageName, version)
  })
  
  // Build all packages
  packages.forEach(packageName => {
    buildPackage(packageName)
  })
  
  // Run tests
  console.log('🧪 Running tests...')
  execSync('npm run test:run', { stdio: 'inherit' })
  
  // Publish packages
  packages.forEach(packageName => {
    publishPackage(packageName)
  })
  
  console.log('🎉 All packages published successfully!')
}

main()
