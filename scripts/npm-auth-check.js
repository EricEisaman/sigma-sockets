#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class NpmAuthCheck {
  constructor() {
    this.projectRoot = process.cwd();
    this.npmConfigFile = path.join(this.projectRoot, '.npm-config.json');
    this.targetUser = 'sirfizx';
    this.targetProfile = 'https://www.npmjs.com/~sirfizx';
  }

  async run() {
    console.log('📦 Checking npm authentication status...\n');

    try {
      await this.checkNpmInstallation();
      await this.checkAuthentication();
      await this.checkPublishingConfig();
      await this.displayStatus();
    } catch (error) {
      console.error('❌ NPM authentication check failed:', error.message);
      console.log('\n💡 To fix this, run: npm run npm:setup');
      process.exit(1);
    }
  }

  async checkNpmInstallation() {
    try {
      const { stdout } = await execAsync('npm --version');
      console.log('✅ npm installed:', stdout.trim());
    } catch (error) {
      throw new Error('npm not installed. Please install Node.js and npm first.');
    }
  }

  async checkAuthentication() {
    try {
      const { stdout } = await execAsync('npm whoami');
      const currentUser = stdout.trim();
      
      if (currentUser === this.targetUser) {
        console.log(`✅ Authenticated as: ${currentUser}`);
        console.log(`✅ Target user matches: ${this.targetUser}`);
      } else {
        console.log(`⚠️  Currently authenticated as: ${currentUser}`);
        console.log(`❌ Expected user: ${this.targetUser}`);
        throw new Error(`Authentication mismatch. Expected: ${this.targetUser}, Got: ${currentUser}`);
      }
    } catch (error) {
      if (error.message.includes('Authentication mismatch')) {
        throw error;
      }
      throw new Error('Not authenticated with npm. Run: npm run npm:setup');
    }
  }

  async checkPublishingConfig() {
    console.log('📋 Checking publishing configuration...');
    
    const packages = [
      'packages/client/package.json',
      'packages/server/package.json',
      'packages/types/package.json'
    ];

    let configValid = true;
    
    for (const packagePath of packages) {
      if (fs.existsSync(packagePath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          
          // Check required fields
          const requiredFields = ['name', 'version', 'author', 'repository', 'license'];
          const missingFields = requiredFields.filter(field => !packageJson[field]);
          
          if (missingFields.length > 0) {
            console.log(`⚠️  ${packagePath} missing fields: ${missingFields.join(', ')}`);
            configValid = false;
          } else {
            console.log(`✅ ${packagePath} configuration valid`);
          }
        } catch (error) {
          console.log(`❌ ${packagePath} configuration error: ${error.message}`);
          configValid = false;
        }
      }
    }
    
    if (!configValid) {
      console.log('⚠️  Some packages have configuration issues');
    } else {
      console.log('✅ All packages have valid configuration');
    }
  }

  async displayStatus() {
    console.log('\n📊 NPM AUTHENTICATION SUMMARY:');
    console.log('===============================');
    
    try {
      const { stdout } = await execAsync('npm whoami');
      const currentUser = stdout.trim();
      
      console.log(`👤 User: ${currentUser}`);
      console.log(`🎯 Target: ${this.targetUser}`);
      console.log(`🔗 Profile: ${this.targetProfile}`);
      
      if (fs.existsSync(this.npmConfigFile)) {
        const config = JSON.parse(fs.readFileSync(this.npmConfigFile, 'utf8'));
        console.log(`📅 Setup Date: ${new Date(config.setupDate).toLocaleDateString()}`);
        console.log(`📦 Packages: ${config.packages.join(', ')}`);
      }
      
      console.log('\n✅ NPM authentication is working correctly!');
      console.log('\nAvailable commands:');
      console.log('  npm run npm:status     - Check npm authentication status');
      console.log('  npm run npm:whoami     - Show current npm user');
      console.log('  npm run publish:all    - Publish all packages');
      console.log('  npm run publish:client - Publish client package');
      console.log('  npm run publish:server - Publish server package');
      console.log('  npm run publish:types  - Publish types package');
      
    } catch (error) {
      throw new Error('Could not retrieve npm user information');
    }
  }
}

// Run the check
const authCheck = new NpmAuthCheck();
authCheck.run().catch(console.error);
