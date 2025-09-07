#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class NpmSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.npmConfigFile = path.join(this.projectRoot, '.npm-config.json');
    this.setupLogFile = path.join(this.projectRoot, '.npm-setup.log');
    this.targetUser = 'sirfizx';
    this.targetProfile = 'https://www.npmjs.com/~sirfizx';
  }

  async run() {
    console.log(`
📦 SIGMASOCKETS NPM PUBLISHING SETUP
============================================================

This script will help you authenticate with npm and set up
your SigmaSockets project for publishing to your npm profile.

Target Profile: ${this.targetProfile}
Target User: ${this.targetUser}

Features:
- npm authentication setup
- Package publishing configuration
- Automated publishing workflow
- Version management
- Security token management

============================================================
    `);

    try {
      await this.checkNpmInstallation();
      await this.authenticateWithNpm();
      await this.verifyAuthentication();
      await this.setupPublishingConfig();
      await this.testPublishing();
      await this.saveConfiguration();
      
      console.log(`
✅ NPM SETUP COMPLETED SUCCESSFULLY!

Your SigmaSockets project is now configured for publishing to npm.

Target Profile: ${this.targetProfile}
Authenticated User: ${this.targetUser}

Available commands:
- npm run publish:all    - Publish all packages
- npm run publish:client - Publish client package
- npm run publish:server - Publish server package
- npm run publish:types  - Publish types package
- npm run npm:status     - Check npm authentication
- npm run npm:whoami     - Show current user

Next steps:
1. Run 'npm run npm:status' to verify authentication
2. Run 'npm run publish:all' to publish all packages
3. Check your profile at ${this.targetProfile}

============================================================
      `);
    } catch (error) {
      console.error('❌ NPM setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkNpmInstallation() {
    console.log('🔍 Checking npm installation...');
    
    try {
      const { stdout } = await execAsync('npm --version');
      console.log('✅ npm is installed:', stdout.trim());
    } catch (error) {
      throw new Error('npm is not installed! Please install Node.js and npm first.');
    }
  }

  async authenticateWithNpm() {
    console.log('🔐 Setting up npm authentication...');
    
    try {
      // Check if already authenticated
      const { stdout } = await execAsync('npm whoami');
      const currentUser = stdout.trim();
      
      if (currentUser === this.targetUser) {
        console.log(`✅ Already authenticated as ${this.targetUser}`);
        return;
      } else {
        console.log(`⚠️  Currently authenticated as: ${currentUser}`);
        console.log(`🔑 Need to authenticate as: ${this.targetUser}`);
      }
    } catch (error) {
      console.log('🔑 Not authenticated with npm');
    }
    
    console.log('🔑 Starting npm authentication process...');
    console.log('This will open your browser for authentication.');
    console.log(`Please log in as: ${this.targetUser}`);
    
    return new Promise((resolve, reject) => {
      const authProcess = spawn('npm', ['login'], {
        stdio: 'inherit',
        shell: true
      });

      authProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ npm authentication successful!');
          resolve();
        } else {
          reject(new Error('npm authentication failed'));
        }
      });

      authProcess.on('error', (error) => {
        reject(new Error(`Authentication process failed: ${error.message}`));
      });
    });
  }

  async verifyAuthentication() {
    console.log('🧪 Verifying npm authentication...');
    
    try {
      const { stdout } = await execAsync('npm whoami');
      const currentUser = stdout.trim();
      
      if (currentUser === this.targetUser) {
        console.log(`✅ Authentication verified! Logged in as: ${currentUser}`);
      } else {
        throw new Error(`Authentication failed. Expected: ${this.targetUser}, Got: ${currentUser}`);
      }
    } catch (error) {
      throw new Error('Could not verify npm authentication');
    }
  }

  async setupPublishingConfig() {
    console.log('⚙️  Setting up publishing configuration...');
    
    // Update package.json files with correct author and repository info
    const packages = [
      'packages/client/package.json',
      'packages/server/package.json',
      'packages/types/package.json'
    ];

    for (const packagePath of packages) {
      if (fs.existsSync(packagePath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          
          // Update author information
          packageJson.author = {
            name: 'Eric Eisaman',
            email: 'eric@eisaman.com',
            url: this.targetProfile
          };
          
          // Update repository information
          packageJson.repository = {
            type: 'git',
            url: 'git@github.com-ericeisaman:EricEisaman/sigma-sockets.git'
          };
          
          // Update homepage
          packageJson.homepage = 'https://github.com/EricEisaman/sigma-sockets#readme';
          
          // Update bugs
          packageJson.bugs = {
            url: 'https://github.com/EricEisaman/sigma-sockets/issues'
          };
          
          // Update keywords
          packageJson.keywords = [
            'websocket',
            'realtime',
            'multiplayer',
            'flatbuffers',
            'high-performance',
            'typescript',
            'nodejs',
            'sigmasockets'
          ];
          
          // Update license
          packageJson.license = 'MIT';
          
          fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
          console.log(`✅ Updated ${packagePath}`);
        } catch (error) {
          console.log(`⚠️  Could not update ${packagePath}: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Publishing configuration updated');
  }

  async testPublishing() {
    console.log('🧪 Testing publishing configuration...');
    
    try {
      // Test npm access
      const { stdout } = await execAsync('npm access list packages');
      console.log('✅ npm access verified');
      console.log('Available packages:', stdout.trim());
    } catch (error) {
      console.log('⚠️  Could not verify npm access, but authentication is working');
    }
  }

  async saveConfiguration() {
    console.log('💾 Saving configuration...');
    
    try {
      const { stdout } = await execAsync('npm whoami');
      const currentUser = stdout.trim();
      
      const config = {
        authenticated: true,
        user: currentUser,
        targetUser: this.targetUser,
        targetProfile: this.targetProfile,
        setupDate: new Date().toISOString(),
        project: 'SigmaSockets',
        version: '1.0.0',
        packages: [
          'sigmasockets-client',
          'sigmasockets-server',
          '@sigmasockets/types'
        ]
      };

      fs.writeFileSync(this.npmConfigFile, JSON.stringify(config, null, 2));
      console.log('✅ Configuration saved to .npm-config.json');
    } catch (error) {
      console.log('⚠️  Could not save configuration, but setup is complete');
    }
  }
}

// Run the setup
const setup = new NpmSetup();
setup.run().catch(console.error);
