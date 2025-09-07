# SigmaSockets Scripts Reference

This document provides a comprehensive reference for all available npm scripts in the SigmaSockets monorepo.

## 🚀 Quick Start Scripts

| Script | Description |
|--------|-------------|
| `npm run setup` | Complete development environment setup |
| `npm run dev` | Start development mode for all packages |
| `npm run build` | Build all packages and apps |
| `npm run test` | Run all tests |
| `npm run qa` | Run quality assurance checks |

## 📦 Core Workflow Scripts

### Installation & Setup
```bash
npm run install:all          # Install all dependencies
npm run install:workspaces   # Install workspace dependencies
npm run setup                # Complete dev environment setup
npm run fresh                # Clean and reinstall everything
```

### Building
```bash
npm run build                # Build all packages and apps
npm run build:packages       # Build client and server packages
npm run build:apps           # Build chat demo and benchmark
npm run build:client         # Build client package only
npm run build:server         # Build server package only
npm run build:chat           # Build chat demo only
npm run build:benchmark      # Build benchmark app only
```

### Development
```bash
npm run dev                  # Start dev mode for packages
npm run dev:packages         # Start dev mode for client & server
npm run dev:client           # Start client development
npm run dev:server           # Start server development
npm run dev:chat             # Start chat demo client
npm run dev:chat:server      # Start chat demo server
npm run dev:benchmark        # Start benchmark development
```

### Testing
```bash
npm run test                 # Run all tests
npm run test:packages        # Test client and server packages
npm run test:apps            # Test chat demo and benchmark
npm run test:run             # Run tests without watch mode
npm run test:watch           # Run tests in watch mode
npm run test:ui              # Run tests with UI
npm run test:coverage        # Run tests with coverage
```

## 🎮 Demo & App Management

### Chat Demo
```bash
npm run demo:chat            # Start both chat server and client
npm run demo:chat:server     # Start chat server only
npm run demo:chat:client     # Start chat client only
```

### Benchmarking
```bash
npm run benchmark:run        # Build and run benchmarks
npm run benchmark:build      # Build benchmark app
npm run benchmark:execute    # Execute benchmarks
npm run benchmark:client     # Run client benchmarks
npm run benchmark:server     # Run server benchmarks
npm run perf                 # Alias for benchmark:run
```

## 📤 Publishing & Release Management

### Publishing
```bash
npm run publish:client       # Publish client package
npm run publish:server       # Publish server package
npm run publish:all          # Publish all packages
npm run publish:version      # Publish with version management
npm run publish:dry-run      # Test publish without actually publishing
```

### Version Management
```bash
npm run version:patch        # Publish patch version
npm run version:minor        # Publish minor version
npm run version:major        # Publish major version
npm run release              # Full release process
npm run release:dry-run      # Test release process
```

## 🛠️ Development Tools

### Dependency Management
```bash
npm run deps:check           # Check for outdated dependencies
npm run deps:update          # Update all dependencies
npm run deps:audit           # Audit dependencies for vulnerabilities
npm run deps:fix             # Fix dependency vulnerabilities
npm run deps:install:clean   # Clean install dependencies
```

### Workspace Management
```bash
npm run workspace:list       # List all workspaces
npm run workspace:info       # Show workspace status
npm run workspace            # Interactive workspace manager
npm run ws                   # Alias for workspace
```

## 🔍 Quality Assurance

### Code Quality
```bash
npm run qa                   # Full quality assurance check
npm run qa:quick             # Quick quality check (type-check + lint)
npm run qa:full              # Full QA with clean install
npm run ci                   # CI/CD quality check
npm run precommit            # Pre-commit hook
npm run prepush              # Pre-push hook
```

### Code Analysis
```bash
npm run lint                 # Lint all code
npm run lint:fix             # Fix linting issues
npm run type-check           # TypeScript type checking
npm run format               # Format code
npm run format:check         # Check code formatting
```

## 🧹 Utility Scripts

### Cleanup
```bash
npm run clean                # Clean all build artifacts
npm run clean:workspaces     # Clean workspace artifacts
npm run clean:root           # Clean root artifacts
npm run logs:clear           # Clear log files
```

### Information & Analysis
```bash
npm run size                 # Show build sizes
npm run size:client          # Show client package size
npm run size:server          # Show server package size
npm run info                 # Show project information
npm run info:project         # Show project details
npm run info:packages        # Show package information
```

### Backup & Maintenance
```bash
npm run backup               # Create project backup
npm run backup:create        # Create timestamped backup
```

## 🚀 Performance & Monitoring

### Performance Testing
```bash
npm run perf                 # Run performance benchmarks
npm run perf:client          # Run client performance tests
npm run perf:server          # Run server performance tests
```

### Monitoring (Future)
```bash
npm run monitor              # Start performance monitoring
npm run profile              # Start profiling
```

## 🐳 Deployment & Infrastructure

### Deployment (Future)
```bash
npm run deploy               # Deploy application
npm run deploy:build         # Build for deployment
npm run deploy:upload        # Upload deployment
```

### Docker (Future)
```bash
npm run docker               # Build Docker image
npm run docker:build         # Build Docker image
npm run docker:run           # Run Docker container
```

## 📋 Git & Version Control

### Git Operations
```bash
npm run git:status           # Show git status
npm run git:clean            # Clean untracked files
npm run git:reset            # Reset to HEAD
npm run git:sync             # Pull and push
npm run git:branch           # Show branches
npm run git:log              # Show recent commits
```

## ❓ Help & Information

### Help Commands
```bash
npm run help                 # Show main help
npm run help:scripts         # Show available scripts
npm run help:all             # Show all scripts
npm run help:workspace       # Show workspace manager help
```

## 🔧 Advanced Usage

### Workspace Manager
The workspace manager provides interactive control over individual workspaces:

```bash
# Interactive workspace management
npm run workspace

# Direct workspace commands
npm run workspace build client
npm run workspace dev server
npm run workspace test chat
npm run workspace clean benchmark
npm run workspace info
```

### Parallel Execution
Many scripts support parallel execution for faster builds:

```bash
# Build packages in parallel
npm run build:packages

# Run tests in parallel
npm run test:packages

# Start development servers in parallel
npm run dev:packages
```

### Environment-Specific Commands
```bash
# Development environment
npm run dev

# Production build
npm run build

# CI/CD environment
npm run ci

# Local testing
npm run qa:quick
```

## 📝 Script Categories

### Core Workflow
- Installation, building, development, testing

### Package Management
- Individual package operations, workspace management

### Quality Assurance
- Linting, type checking, testing, formatting

### Publishing & Release
- Version management, publishing, release automation

### Development Tools
- Dependency management, workspace utilities

### Utility & Maintenance
- Cleanup, information, backup, monitoring

### Future Features
- Deployment, Docker, advanced monitoring

## 🎯 Best Practices

1. **Use `npm run setup`** for initial project setup
2. **Use `npm run qa`** before committing code
3. **Use `npm run fresh`** when encountering build issues
4. **Use `npm run workspace`** for individual package operations
5. **Use `npm run help`** to discover available commands

## 🚨 Troubleshooting

### Common Issues
- **Build failures**: Run `npm run fresh` to clean and reinstall
- **Test failures**: Run `npm run qa:quick` to check code quality
- **Dependency issues**: Run `npm run deps:install:clean`
- **Workspace issues**: Run `npm run workspace:info` to check status

### Getting Help
- Run `npm run help` for script overview
- Run `npm run help:all` for complete script list
- Run `npm run help:workspace` for workspace manager help
- Check individual package.json files for package-specific scripts
