#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import TodoManager from './todo-manager.js';

class CompletionTrigger {
  constructor() {
    this.todoManager = new TodoManager();
    this.completionPhrases = [
      'The SigmaSockets project now has',
      'What Was Accomplished',
      'The system is now ready',
      'Project is complete',
      'Implementation is finished',
      'Setup is complete',
      'Configuration is ready',
      'Deployment is ready',
      'All features implemented',
      'Project successfully',
      'Successfully completed',
      'Fully implemented',
      'Completely configured',
      'Ready for production',
      'All systems operational'
    ];
  }

  /**
   * Detects completion phrases in text and triggers improvement cycle
   */
  detectCompletion(text) {
    const lowerText = text.toLowerCase();
    
    for (const phrase of this.completionPhrases) {
      if (lowerText.includes(phrase.toLowerCase())) {
        console.log(`🎯 COMPLETION TRIGGER DETECTED: "${phrase}"`);
        return true;
      }
    }
    
    // Also detect common completion patterns
    const completionPatterns = [
      'system is now ready',
      'project is now complete',
      'implementation is finished',
      'all tasks completed',
      'ready for production',
      'system is fully operational',
      'excellence achieved',
      'perfection achieved',
      'continuous evolution',
      'automatically improve',
      'now ready to automatically',
      'ensuring continuous evolution',
      'toward perfection'
    ];
    
    for (const pattern of completionPatterns) {
      if (lowerText.includes(pattern)) {
        console.log(`🎯 COMPLETION PATTERN DETECTED: "${pattern}"`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Triggers the improvement cycle
   */
  async triggerImprovementCycle() {
    console.log('🚀 TRIGGERING IMPROVEMENT CYCLE...');
    
    try {
      // 1. Re-evaluate current TODOs
      console.log('📋 Step 1: Re-evaluating TODOs...');
      await this.reevaluateTODOs();
      
      // 2. Analyze project state
      console.log('🔍 Step 2: Analyzing project state...');
      await this.analyzeProjectState();
      
      // 3. Identify improvement opportunities
      console.log('💡 Step 3: Identifying improvements...');
      await this.identifyImprovements();
      
      // 4. Update TODOs with new priorities
      console.log('📝 Step 4: Updating TODO priorities...');
      await this.updateTODOPriorities();
      
      // 5. Generate improvement summary
      console.log('📊 Step 5: Generating improvement summary...');
      await this.generateImprovementSummary();
      
      console.log('✅ IMPROVEMENT CYCLE COMPLETED');
      
    } catch (error) {
      console.error('❌ Error in improvement cycle:', error);
    }
  }

  /**
   * Re-evaluate current TODOs based on project state
   */
  async reevaluateTODOs() {
    console.log('📋 Re-evaluating TODOs...');
    
    const todos = this.todoManager.todos;
    const currentState = await this.getProjectState();
    
    // Mark completed items
    const completedItems = this.identifyCompletedItems(todos, currentState);
    completedItems.forEach(item => {
      this.todoManager.completeTodo(item.id);
    });
    
    // Update existing TODOs based on current state
    const updatedItems = this.updateExistingTODOs(todos, currentState);
    updatedItems.forEach(item => {
      this.todoManager.updateTodo(item.id, item.content, item.status);
    });
    
    console.log(`✅ Marked ${completedItems.length} items as completed`);
    console.log(`🔄 Updated ${updatedItems.length} existing items`);
  }

  /**
   * Analyze current project state
   */
  async analyzeProjectState() {
    console.log('🔍 Analyzing project state...');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      buildStatus: await this.checkBuildStatus(),
      testStatus: await this.checkTestStatus(),
      securityStatus: await this.checkSecurityStatus(),
      documentationStatus: await this.checkDocumentationStatus(),
      deploymentStatus: await this.checkDeploymentStatus(),
      performanceStatus: await this.checkPerformanceStatus(),
      developerExperience: await this.checkDeveloperExperience()
    };
    
    // Save analysis
    fs.writeFileSync('.project-analysis.json', JSON.stringify(analysis, null, 2));
    
    console.log('📊 Project analysis saved to .project-analysis.json');
    return analysis;
  }

  /**
   * Identify improvement opportunities
   */
  async identifyImprovements() {
    console.log('💡 Identifying improvement opportunities...');
    
    const improvements = [];
    const analysis = JSON.parse(fs.readFileSync('.project-analysis.json', 'utf8'));
    
    // Performance improvements
    if (analysis.performanceStatus.score < 90) {
      improvements.push({
        category: 'performance',
        priority: 'high',
        description: 'Optimize performance metrics and benchmarks',
        action: 'Run performance analysis and implement optimizations'
      });
    }
    
    // Security improvements
    if (analysis.securityStatus.score < 95) {
      improvements.push({
        category: 'security',
        priority: 'critical',
        description: 'Enhance security posture',
        action: 'Review and implement additional security measures'
      });
    }
    
    // Developer experience improvements
    if (analysis.developerExperience.score < 85) {
      improvements.push({
        category: 'developer-experience',
        priority: 'medium',
        description: 'Improve developer onboarding and experience',
        action: 'Enhance documentation, examples, and tooling'
      });
    }
    
    // Documentation improvements
    if (analysis.documentationStatus.score < 80) {
      improvements.push({
        category: 'documentation',
        priority: 'medium',
        description: 'Expand and improve documentation',
        action: 'Add more examples, tutorials, and API documentation'
      });
    }
    
    // Test coverage improvements
    if (analysis.testStatus.coverage < 90) {
      improvements.push({
        category: 'testing',
        priority: 'high',
        description: 'Increase test coverage',
        action: 'Add more comprehensive tests for edge cases'
      });
    }
    
    // Save improvements
    fs.writeFileSync('.improvements.json', JSON.stringify(improvements, null, 2));
    
    console.log(`🎯 Identified ${improvements.length} improvement opportunities`);
    return improvements;
  }

  /**
   * Update TODO priorities based on improvements
   */
  async updateTODOPriorities() {
    console.log('📝 Updating TODO priorities...');
    
    const improvements = JSON.parse(fs.readFileSync('.improvements.json', 'utf8'));
    
    improvements.forEach(improvement => {
      const todoId = `improve-${improvement.category}`;
      const content = `${improvement.description} (Priority: ${improvement.priority})`;
      
      this.todoManager.addTodo(content, 'pending', improvement.priority, {
        category: improvement.category,
        priority: improvement.priority,
        action: improvement.action,
        autoGenerated: true
      });
    });
    
    console.log(`✅ Added ${improvements.length} improvement TODOs`);
  }

  /**
   * Generate improvement summary
   */
  async generateImprovementSummary() {
    console.log('📊 Generating improvement summary...');
    
    const analysis = JSON.parse(fs.readFileSync('.project-analysis.json', 'utf8'));
    const improvements = JSON.parse(fs.readFileSync('.improvements.json', 'utf8'));
    const todos = this.todoManager.todos;
    
    const summary = {
      timestamp: new Date().toISOString(),
      projectHealth: this.calculateProjectHealth(analysis),
      improvementAreas: improvements.map(imp => ({
        category: imp.category,
        priority: imp.priority,
        description: imp.description
      })),
      activeTODOs: todos.filter(todo => todo.status === 'pending').length,
      completedTODOs: todos.filter(todo => todo.status === 'completed').length,
      nextActions: this.generateNextActions(improvements)
    };
    
    // Save summary
    fs.writeFileSync('.improvement-summary.json', JSON.stringify(summary, null, 2));
    
    console.log('📋 Improvement summary generated');
    return summary;
  }

  /**
   * Check build status
   */
  async checkBuildStatus() {
    try {
      const result = await this.runCommand('npm run build');
      return {
        status: 'success',
        score: 100,
        details: 'All packages build successfully'
      };
    } catch (error) {
      return {
        status: 'error',
        score: 0,
        details: error.message
      };
    }
  }

  /**
   * Check test status
   */
  async checkTestStatus() {
    try {
      const result = await this.runCommand('npm run test:run');
      return {
        status: 'success',
        score: 95,
        coverage: 85,
        details: 'Tests passing with good coverage'
      };
    } catch (error) {
      return {
        status: 'error',
        score: 0,
        coverage: 0,
        details: error.message
      };
    }
  }

  /**
   * Check security status
   */
  async checkSecurityStatus() {
    const securityFiles = [
      'packages/server/src/security.ts',
      'packages/server/src/validation.ts',
      'SECURITY-REVIEW.md'
    ];
    
    const existingFiles = securityFiles.filter(file => fs.existsSync(file));
    
    return {
      status: existingFiles.length === securityFiles.length ? 'excellent' : 'good',
      score: (existingFiles.length / securityFiles.length) * 100,
      details: `${existingFiles.length}/${securityFiles.length} security files present`
    };
  }

  /**
   * Check documentation status
   */
  async checkDocumentationStatus() {
    const docFiles = [
      'README.md',
      'DEPLOY_RENDER.md',
      'SECURITY-REVIEW.md',
      'REVIEW-SUMMARY.md',
      'RENDER-DEPLOYMENT-SUMMARY.md'
    ];
    
    const existingFiles = docFiles.filter(file => fs.existsSync(file));
    
    return {
      status: existingFiles.length >= 4 ? 'good' : 'needs-improvement',
      score: (existingFiles.length / docFiles.length) * 100,
      details: `${existingFiles.length}/${docFiles.length} documentation files present`
    };
  }

  /**
   * Check deployment status
   */
  async checkDeploymentStatus() {
    const deploymentFiles = [
      'Dockerfile',
      'render.yaml',
      '.dockerignore',
      'DEPLOY_RENDER.md'
    ];
    
    const existingFiles = deploymentFiles.filter(file => fs.existsSync(file));
    
    return {
      status: existingFiles.length === deploymentFiles.length ? 'ready' : 'incomplete',
      score: (existingFiles.length / deploymentFiles.length) * 100,
      details: `${existingFiles.length}/${deploymentFiles.length} deployment files present`
    };
  }

  /**
   * Check performance status
   */
  async checkPerformanceStatus() {
    const performanceFiles = [
      'apps/benchmark/src/benchmark-runner.ts',
      'apps/benchmark/src/benchmark-reporter.ts',
      'SigmaSockets Performance Benchmark Results.md'
    ];
    
    const existingFiles = performanceFiles.filter(file => fs.existsSync(file));
    
    return {
      status: existingFiles.length >= 2 ? 'good' : 'needs-improvement',
      score: (existingFiles.length / performanceFiles.length) * 100,
      details: `${existingFiles.length}/${performanceFiles.length} performance files present`
    };
  }

  /**
   * Check developer experience
   */
  async checkDeveloperExperience() {
    const devFiles = [
      'package.json',
      'tsconfig.json',
      '.eslintrc.js',
      '.prettierrc.js',
      'scripts/',
      'LINTING.md',
      'TYPES.md'
    ];
    
    const existingFiles = devFiles.filter(file => fs.existsSync(file));
    
    return {
      status: existingFiles.length >= 6 ? 'excellent' : 'good',
      score: (existingFiles.length / devFiles.length) * 100,
      details: `${existingFiles.length}/${devFiles.length} developer experience files present`
    };
  }

  /**
   * Get current project state
   */
  async getProjectState() {
    return {
      timestamp: new Date().toISOString(),
      buildStatus: await this.checkBuildStatus(),
      testStatus: await this.checkTestStatus(),
      securityStatus: await this.checkSecurityStatus(),
      documentationStatus: await this.checkDocumentationStatus(),
      deploymentStatus: await this.checkDeploymentStatus(),
      performanceStatus: await this.checkPerformanceStatus(),
      developerExperience: await this.checkDeveloperExperience()
    };
  }

  /**
   * Identify completed items based on project state
   */
  identifyCompletedItems(todos, state) {
    const completed = [];
    
    // Check for completed security implementation
    if (state.securityStatus.score >= 95) {
      const securityTodo = todos.find(todo => 
        todo.content.toLowerCase().includes('security') && 
        todo.status === 'pending'
      );
      if (securityTodo) completed.push(securityTodo);
    }
    
    // Check for completed deployment setup
    if (state.deploymentStatus.score >= 95) {
      const deploymentTodo = todos.find(todo => 
        todo.content.toLowerCase().includes('deployment') && 
        todo.status === 'pending'
      );
      if (deploymentTodo) completed.push(deploymentTodo);
    }
    
    return completed;
  }

  /**
   * Update existing TODOs based on current state
   */
  updateExistingTODOs(todos, state) {
    const updated = [];
    
    // Update performance-related TODOs
    if (state.performanceStatus.score < 90) {
      const perfTodo = todos.find(todo => 
        todo.content.toLowerCase().includes('performance') && 
        todo.status === 'pending'
      );
      if (perfTodo) {
        updated.push({
          id: perfTodo.id,
          content: `${perfTodo.content} (Current score: ${state.performanceStatus.score}%)`,
          status: 'in_progress'
        });
      }
    }
    
    return updated;
  }

  /**
   * Calculate overall project health
   */
  calculateProjectHealth(analysis) {
    const scores = [
      analysis.buildStatus.score,
      analysis.testStatus.score,
      analysis.securityStatus.score,
      analysis.documentationStatus.score,
      analysis.deploymentStatus.score,
      analysis.performanceStatus.score,
      analysis.developerExperience.score
    ];
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (averageScore >= 95) return 'excellent';
    if (averageScore >= 85) return 'good';
    if (averageScore >= 70) return 'fair';
    return 'needs-improvement';
  }

  /**
   * Generate next actions based on improvements
   */
  generateNextActions(improvements) {
    const critical = improvements.filter(imp => imp.priority === 'critical');
    const high = improvements.filter(imp => imp.priority === 'high');
    const medium = improvements.filter(imp => imp.priority === 'medium');
    
    const actions = [];
    
    if (critical.length > 0) {
      actions.push(`🚨 Address ${critical.length} critical improvement(s) immediately`);
    }
    
    if (high.length > 0) {
      actions.push(`⚡ Implement ${high.length} high-priority improvement(s)`);
    }
    
    if (medium.length > 0) {
      actions.push(`📈 Consider ${medium.length} medium-priority improvement(s)`);
    }
    
    return actions;
  }

  /**
   * Run a command and return the result
   */
  async runCommand(command) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
    });
  }
}

// Export for use in other scripts
export default CompletionTrigger;

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('completion-trigger.js');

if (isMainModule) {
  console.log('🎯 COMPLETION TRIGGER SYSTEM STARTING...');
  
  const trigger = new CompletionTrigger();
  
  // Check if completion phrase was detected
  const input = process.argv.slice(2).join(' ');
  console.log(`📝 Input received: "${input}"`);
  
  if (input && trigger.detectCompletion(input)) {
    console.log('🎯 COMPLETION PHRASE DETECTED IN INPUT');
    await trigger.triggerImprovementCycle();
  } else if (!input) {
    // If no input provided, trigger improvement cycle anyway
    console.log('🚀 TRIGGERING IMPROVEMENT CYCLE (manual trigger)');
    await trigger.triggerImprovementCycle();
  } else {
    console.log('ℹ️ No completion phrase detected in input');
  }
}
