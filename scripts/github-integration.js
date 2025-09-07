#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class GitHubIntegration {
  constructor() {
    this.projectRoot = process.cwd();
    this.githubConfigFile = path.join(this.projectRoot, '.github-config.json');
  }

  async run() {
    const command = process.argv[2];
    
    switch (command) {
      case 'create-issue':
        await this.createIssue();
        break;
      case 'create-pr':
        await this.createPullRequest();
        break;
      case 'sync-repo':
        await this.syncRepository();
        break;
      case 'check-status':
        await this.checkStatus();
        break;
      case 'list-issues':
        await this.listIssues();
        break;
      case 'list-prs':
        await this.listPullRequests();
        break;
      default:
        this.showHelp();
    }
  }

  async createIssue() {
    const title = process.argv[3] || 'New Issue';
    const body = process.argv[4] || 'Please describe the issue here.';
    const labels = process.argv[5] || 'bug,enhancement';

    try {
      const { stdout } = await execAsync(`gh issue create --title "${title}" --body "${body}" --label "${labels}"`);
      console.log('✅ Issue created successfully!');
      console.log(stdout);
    } catch (error) {
      console.error('❌ Failed to create issue:', error.message);
    }
  }

  async createPullRequest() {
    const title = process.argv[3] || 'New Pull Request';
    const body = process.argv[4] || 'Please describe the changes in this PR.';
    const base = process.argv[5] || 'main';
    const head = process.argv[6] || 'develop';

    try {
      const { stdout } = await execAsync(`gh pr create --title "${title}" --body "${body}" --base "${base}" --head "${head}"`);
      console.log('✅ Pull request created successfully!');
      console.log(stdout);
    } catch (error) {
      console.error('❌ Failed to create pull request:', error.message);
    }
  }

  async syncRepository() {
    try {
      console.log('🔄 Syncing repository...');
      await execAsync('git pull origin main');
      await execAsync('git push origin main');
      console.log('✅ Repository synced successfully!');
    } catch (error) {
      console.error('❌ Failed to sync repository:', error.message);
    }
  }

  async checkStatus() {
    try {
      console.log('📊 Repository Status:');
      console.log('===================');
      
      const { stdout: status } = await execAsync('git status --porcelain');
      if (status.trim()) {
        console.log('📝 Uncommitted changes:');
        console.log(status);
      } else {
        console.log('✅ Working directory is clean');
      }

      const { stdout: branch } = await execAsync('git branch --show-current');
      console.log(`🌿 Current branch: ${branch.trim()}`);

      const { stdout: remote } = await execAsync('git remote -v');
      console.log('🔗 Remote repositories:');
      console.log(remote);

    } catch (error) {
      console.error('❌ Failed to check status:', error.message);
    }
  }

  async listIssues() {
    try {
      const { stdout } = await execAsync('gh issue list --state all --limit 10');
      console.log('📋 Recent Issues:');
      console.log('================');
      console.log(stdout);
    } catch (error) {
      console.error('❌ Failed to list issues:', error.message);
    }
  }

  async listPullRequests() {
    try {
      const { stdout } = await execAsync('gh pr list --state all --limit 10');
      console.log('📋 Recent Pull Requests:');
      console.log('=======================');
      console.log(stdout);
    } catch (error) {
      console.error('❌ Failed to list pull requests:', error.message);
    }
  }

  showHelp() {
    console.log(`
🔐 SIGMASOCKETS GITHUB INTEGRATION
============================================================

Usage: node scripts/github-integration.js <command> [options]

Commands:
  create-issue [title] [body] [labels]  - Create a new issue
  create-pr [title] [body] [base] [head] - Create a new pull request
  sync-repo                            - Sync repository with remote
  check-status                         - Check repository status
  list-issues                          - List recent issues
  list-prs                             - List recent pull requests

Examples:
  node scripts/github-integration.js create-issue "Bug Report" "Description here" "bug,urgent"
  node scripts/github-integration.js create-pr "Feature: New API" "Added new endpoints" "main" "feature-branch"
  node scripts/github-integration.js check-status
  node scripts/github-integration.js list-issues

Prerequisites:
  - GitHub CLI must be installed and authenticated
  - Run 'npm run gh:setup' to set up authentication
  - Run 'npm run gh:check' to verify authentication

============================================================
    `);
  }
}

// Run the integration
const integration = new GitHubIntegration();
integration.run().catch(console.error);
