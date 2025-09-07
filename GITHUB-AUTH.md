# GitHub CLI Authentication Setup

This document explains how to set up and use GitHub CLI authentication for the SigmaSockets project, following the same pattern as the ScholarTrack project.

## Overview

The SigmaSockets project includes comprehensive GitHub CLI integration for:
- Repository management
- Issue tracking
- Pull request management
- Automated workflows
- CI/CD pipeline integration

## Prerequisites

### 1. Install GitHub CLI

**macOS (Homebrew):**
```bash
brew install gh
```

**Windows (Chocolatey):**
```bash
choco install gh
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**Or visit:** https://cli.github.com/

### 2. Verify Installation
```bash
gh --version
```

## Authentication Setup

### SSH Key Authentication (Recommended)
The SigmaSockets project is configured to use SSH key authentication, following the same pattern as the ScholarTrack project.

**SSH Configuration:**
- SSH Key: `~/.ssh/id_ed25519_ericeisaman`
- SSH Host: `github.com-ericeisaman`
- Repository URL: `git@github.com-ericeisaman:EricEisaman/sigma-sockets.git`

**SSH Config Entry:**
```ssh
Host github.com-ericeisaman
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_ericeisaman
  IdentitiesOnly yes
```

### Quick Setup
Run the automated setup script:
```bash
npm run gh:setup
```

This will:
- Check GitHub CLI installation
- Test SSH authentication
- Verify repository connection
- Set up workflows and templates
- Test authentication

### Manual Authentication
If you prefer manual setup:
```bash
# Test SSH authentication
ssh -T git@github.com-ericeisaman

# Check authentication status
npm run gh:status

# Verify setup
npm run gh:check
```

## Available Commands

### Authentication Commands
```bash
npm run gh:auth      # Authenticate with GitHub (opens browser)
npm run gh:status    # Check authentication status
npm run gh:logout    # Logout from GitHub
npm run gh:token     # Get authentication token
npm run gh:whoami    # Show current user info
npm run gh:check     # Comprehensive authentication check
```

### Repository Commands
```bash
npm run gh:repo      # View repository information
npm run gh:sync      # Sync repository with remote
npm run gh:clone     # Clone repository
npm run gh:fork      # Fork repository
```

### Issue Management
```bash
npm run gh:issues           # List repository issues
npm run gh:create-issue     # Create new issue
npm run gh:integrate create-issue "Title" "Body" "labels"
```

### Pull Request Management
```bash
npm run gh:prs              # List pull requests
npm run gh:create-pr        # Create new pull request
npm run gh:integrate create-pr "Title" "Body" "base" "head"
```

### Integration Commands
```bash
npm run gh:integrate check-status    # Check repository status
npm run gh:integrate list-issues     # List recent issues
npm run gh:integrate list-prs        # List recent pull requests
npm run gh:integrate sync-repo       # Sync repository
```

## Workflow Integration

### CI/CD Pipeline
The setup creates a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that:
- Runs on push to main/develop branches
- Runs on pull requests
- Tests with Node.js 18.x and 20.x
- Performs type checking, linting, and testing
- Builds packages
- Publishes to npm (on main branch)

### Issue Templates
Automatically creates:
- Bug report template
- Feature request template
- Custom issue templates

## Security Considerations

### Token Management
- GitHub CLI handles token management automatically
- Tokens are stored securely in your system
- Use `npm run gh:token` to access token when needed

### Repository Access
- Ensure you have appropriate permissions for the repository
- For private repositories, ensure your GitHub account has access
- Use `npm run gh:repo` to verify repository access

## Troubleshooting

### Common Issues

**1. "GitHub CLI not installed"**
```bash
# Install GitHub CLI (see Prerequisites section)
# Then run: npm run gh:setup
```

**2. "Not authenticated with GitHub"**
```bash
npm run gh:auth
# Follow the browser authentication flow
```

**3. "Repository not found"**
```bash
# Check if repository exists and you have access
npm run gh:repo
# If not, create repository with: gh repo create
```

**4. "Permission denied"**
```bash
# Check your GitHub account permissions
npm run gh:whoami
# Ensure you have write access to the repository
```

### Verification Steps
```bash
# 1. Check GitHub CLI installation
gh --version

# 2. Check authentication
npm run gh:status

# 3. Verify repository access
npm run gh:repo

# 4. Test API access
npm run gh:whoami

# 5. Run comprehensive check
npm run gh:check
```

## Integration with Development Workflow

### Pre-commit Checks
Add to your development workflow:
```bash
# Before committing
npm run gh:check
npm run type-check
npm run lint:check
npm run test
```

### Issue Management
```bash
# Create issue for bug
npm run gh:integrate create-issue "Bug: FlatBuffers error" "Description of the bug" "bug,urgent"

# Create issue for feature
npm run gh:integrate create-issue "Feature: New API endpoint" "Description of the feature" "enhancement"
```

### Pull Request Workflow
```bash
# Create feature branch
git checkout -b feature/new-api

# Make changes and commit
git add .
git commit -m "Add new API endpoint"

# Push branch
git push origin feature/new-api

# Create pull request
npm run gh:integrate create-pr "Feature: New API endpoint" "Added new endpoint for user management" "main" "feature/new-api"
```

## Configuration Files

### `.github-config.json`
Created during setup, contains:
```json
{
  "authenticated": true,
  "user": {
    "login": "username",
    "name": "Full Name",
    "email": "email@example.com",
    "id": 12345
  },
  "setupDate": "2025-01-07T01:30:00.000Z",
  "project": "SigmaSockets",
  "version": "1.0.0"
}
```

### `.github/workflows/ci-cd.yml`
Automated CI/CD pipeline for:
- Testing
- Building
- Publishing

### `.github/ISSUE_TEMPLATE/`
Issue templates for:
- Bug reports
- Feature requests

## Best Practices

1. **Always authenticate before development**
   ```bash
   npm run gh:check
   ```

2. **Use descriptive issue titles**
   ```bash
   npm run gh:integrate create-issue "Bug: Memory leak in WebSocket connection" "Detailed description" "bug,performance"
   ```

3. **Create pull requests for all changes**
   ```bash
   npm run gh:integrate create-pr "Fix: Memory leak in WebSocket" "Fixed memory leak by properly closing connections" "main" "fix/memory-leak"
   ```

4. **Keep repository synced**
   ```bash
   npm run gh:integrate sync-repo
   ```

5. **Use appropriate labels**
   - `bug` - For bug reports
   - `enhancement` - For feature requests
   - `urgent` - For critical issues
   - `performance` - For performance-related issues

## Support

If you encounter issues with GitHub CLI authentication:

1. Check the troubleshooting section above
2. Run `npm run gh:check` for comprehensive diagnostics
3. Visit [GitHub CLI documentation](https://cli.github.com/manual/)
4. Open an issue in the repository

## Related Commands

- `npm run setup` - Complete project setup
- `npm run qa` - Quality assurance checks
- `npm run test` - Run all tests
- `npm run build` - Build all packages
- `npm run publish` - Publish packages to npm
