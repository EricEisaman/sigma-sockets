/**
 * Simple Progress Tracker for DoD Report Generation
 * 
 * This module tracks report generation progress using JSON files
 * and provides real-time progress updates for command oversight.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

class SimpleProgressTracker {
  constructor() {
    this.progressDir = join(process.cwd(), 'test-results');
    this.progressFile = join(this.progressDir, 'progress.json');
    this.reportId = `report_${Date.now()}`;
  }

  async initialize() {
    console.log('📊 Initializing simple progress tracker...');
    
    // Ensure progress directory exists
    if (!existsSync(this.progressDir)) {
      mkdirSync(this.progressDir, { recursive: true });
    }

    // Initialize progress file
    const initialProgress = {
      reportId: this.reportId,
      progress: 0,
      currentStep: 'Initializing',
      status: 'IN_PROGRESS',
      timestamp: new Date().toISOString(),
      history: []
    };
    
    writeFileSync(this.progressFile, JSON.stringify(initialProgress, null, 2));
    console.log('✅ Simple progress tracker initialized');
  }

  async updateProgress(percentage, step, status = 'IN_PROGRESS') {
    const progressData = {
      reportId: this.reportId,
      progress: percentage,
      currentStep: step,
      status: status,
      timestamp: new Date().toISOString(),
      history: this.getHistory()
    };
    
    // Add to history
    progressData.history.push({
      progress: percentage,
      step: step,
      status: status,
      timestamp: progressData.timestamp
    });
    
    writeFileSync(this.progressFile, JSON.stringify(progressData, null, 2));
  }

  getHistory() {
    if (!existsSync(this.progressFile)) {
      return [];
    }
    
    try {
      const data = JSON.parse(readFileSync(this.progressFile, 'utf8'));
      return data.history || [];
    } catch (error) {
      return [];
    }
  }

  getLatestProgress() {
    if (!existsSync(this.progressFile)) {
      return null;
    }
    
    try {
      return JSON.parse(readFileSync(this.progressFile, 'utf8'));
    } catch (error) {
      return null;
    }
  }
}

export { SimpleProgressTracker };
