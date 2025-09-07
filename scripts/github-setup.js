#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class GitHubSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.githubConfigFile = path.join(this.projectRoot, '.github-config.json');
    this.setupLogFile = path.join(this.projectRoot, '.github-setup.log');
  }

  async run() {
    console.log(`
🔐 SIGMASOCKETS GITHUB CLI AUTHENTICATION SETUP
============================================================

This script will help you authenticate with GitHub CLI and set up
your SigmaSockets project for seamless GitHub integration.

Features:
- GitHub CLI authentication
- Repository verification
- Issue and PR management setup
- Automated workflow configuration
- Security token management

============================================================
    `);

    try {
      await this.checkGitHubCLI();
      await this.authenticateWithGitHub();
      await this.verifyRepository();
      await this.setupWorkflows();
      await this.testAuthentication();
      await this.saveConfiguration();
      
      console.log(`
✅ GITHUB SETUP COMPLETED SUCCESSFULLY!

Your SigmaSockets project is now fully integrated with GitHub CLI.

Available commands:
- npm run gh:status    - Check authentication status
- npm run gh:issues    - List repository issues
- npm run gh:prs       - List pull requests
- npm run gh:create-issue - Create new issue
- npm run gh:create-pr    - Create pull request
- npm run gh:sync      - Sync repository

Next steps:
1. Run 'npm run gh:status' to verify authentication
2. Run 'npm run gh:issues' to see current issues
3. Create your first issue with 'npm run gh:create-issue'

============================================================
      `);
    } catch (error) {
      console.error('❌ GitHub setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkGitHubCLI() {
    console.log('🔍 Checking GitHub CLI installation...');
    
    try {
      const { stdout } = await execAsync('gh --version');
      console.log('✅ GitHub CLI is installed:', stdout.trim());
    } catch (error) {
      console.error('❌ GitHub CLI is not installed!');
      console.log(`
Please install GitHub CLI first:

macOS (Homebrew):
  brew install gh

Windows (Chocolatey):
  choco install gh

Linux (Ubuntu/Debian):
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt update
  sudo apt install gh

Or visit: https://cli.github.com/
      `);
      throw new Error('GitHub CLI not installed');
    }
  }

  async authenticateWithGitHub() {
    console.log('🔐 Setting up GitHub authentication...');
    
    try {
      // Check SSH authentication first
      console.log('🔑 Testing SSH authentication...');
      const { stdout: sshTest, stderr: sshError } = await execAsync('ssh -T git@github.com-ericeisaman');
      const sshOutput = stdout + sshError; // SSH outputs to stderr for this command
      if (sshOutput.includes('Hi EricEisaman!')) {
        console.log('✅ SSH authentication is working!');
        console.log('   Using SSH key: ~/.ssh/id_ed25519_ericeisaman');
        console.log('   Repository configured for SSH access');
        return;
      }
    } catch (error) {
      // SSH -T command returns exit code 1 even on success, so check the output
      if (error.stdout && error.stdout.includes('Hi EricEisaman!')) {
        console.log('✅ SSH authentication is working!');
        console.log('   Using SSH key: ~/.ssh/id_ed25519_ericeisaman');
        console.log('   Repository configured for SSH access');
        return;
      }
      if (error.stderr && error.stderr.includes('Hi EricEisaman!')) {
        console.log('✅ SSH authentication is working!');
        console.log('   Using SSH key: ~/.ssh/id_ed25519_ericeisaman');
        console.log('   Repository configured for SSH access');
        return;
      }
      console.log('⚠️  SSH authentication test failed, checking GitHub CLI...');
    }
    
    try {
      // Check if GitHub CLI is already authenticated
      const { stdout } = await execAsync('gh auth status');
      console.log('✅ GitHub CLI is authenticated');
      console.log(stdout);
    } catch (error) {
      console.log('🔑 Starting GitHub CLI authentication process...');
      console.log('This will open your browser for authentication.');
      
      return new Promise((resolve, reject) => {
        const authProcess = spawn('gh', ['auth', 'login', '--web'], {
          stdio: 'inherit',
          shell: true
        });

        authProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ GitHub CLI authentication successful!');
            resolve();
          } else {
            reject(new Error('GitHub CLI authentication failed'));
          }
        });

        authProcess.on('error', (error) => {
          reject(new Error(`Authentication process failed: ${error.message}`));
        });
      });
    }
  }

  async verifyRepository() {
    console.log('📁 Verifying repository connection...');
    
    try {
      const { stdout } = await execAsync('gh repo view');
      console.log('✅ Repository connection verified');
      console.log(stdout);
    } catch (error) {
      console.log('⚠️  Repository not found or not accessible');
      console.log('This is normal if you haven\'t created the repository yet.');
      console.log('You can create it later with: gh repo create');
    }
  }

  async setupWorkflows() {
    console.log('⚙️  Setting up GitHub workflows...');
    
    const workflowsDir = path.join(this.projectRoot, '.github', 'workflows');
    
    // Create .github/workflows directory if it doesn't exist
    if (!fs.existsSync(workflowsDir)) {
      fs.mkdirSync(workflowsDir, { recursive: true });
      console.log('📁 Created .github/workflows directory');
    }

    // Create CI/CD workflow
    const ciWorkflow = `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run linting
      run: npm run lint:check
    
    - name: Run tests
      run: npm run test
    
    - name: Build packages
      run: npm run build

  publish:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
        registry-url: 'https://registry.npmjs.org'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build packages
      run: npm run build
    
    - name: Publish to npm
      run: npm run publish
      env:
        NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
`;

    const workflowFile = path.join(workflowsDir, 'ci-cd.yml');
    fs.writeFileSync(workflowFile, ciWorkflow);
    console.log('✅ Created CI/CD workflow');

    // Create issue templates
    const issueTemplateDir = path.join(this.projectRoot, '.github', 'ISSUE_TEMPLATE');
    if (!fs.existsSync(issueTemplateDir)) {
      fs.mkdirSync(issueTemplateDir, { recursive: true });
    }

    const bugTemplate = `---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Node.js version: [e.g. 18.x, 20.x]
- Browser: [e.g. Chrome, Firefox, Safari]

**Additional context**
Add any other context about the problem here.
`;

    const featureTemplate = `---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
`;

    fs.writeFileSync(path.join(issueTemplateDir, 'bug_report.md'), bugTemplate);
    fs.writeFileSync(path.join(issueTemplateDir, 'feature_request.md'), featureTemplate);
    console.log('✅ Created issue templates');
  }

  async testAuthentication() {
    console.log('🧪 Testing GitHub authentication...');
    
    try {
      const { stdout } = await execAsync('gh api user');
      const user = JSON.parse(stdout);
      console.log(`✅ Authentication test successful!`);
      console.log(`   Logged in as: ${user.login} (${user.name})`);
      console.log(`   Email: ${user.email || 'Not public'}`);
    } catch (error) {
      throw new Error('Authentication test failed');
    }
  }

  async saveConfiguration() {
    console.log('💾 Saving configuration...');
    
    try {
      const { stdout } = await execAsync('gh api user');
      const user = JSON.parse(stdout);
      
      const config = {
        authenticated: true,
        user: {
          login: user.login,
          name: user.name,
          email: user.email,
          id: user.id
        },
        setupDate: new Date().toISOString(),
        project: 'SigmaSockets',
        version: '1.0.0'
      };

      fs.writeFileSync(this.githubConfigFile, JSON.stringify(config, null, 2));
      console.log('✅ Configuration saved to .github-config.json');
    } catch (error) {
      console.log('⚠️  Could not save configuration, but setup is complete');
    }
  }
}

// Run the setup
const setup = new GitHubSetup();
setup.run().catch(console.error);
