/**
 * Simple Progress Watcher for DoD Report Generation
 * 
 * This process watches the JSON progress file for updates
 * and displays real-time progress for command oversight.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

class SimpleProgressWatcher {
  constructor() {
    this.progressFile = join(process.cwd(), 'test-results', 'progress.json');
    this.isWatching = false;
    this.lastProgress = 0;
  }

  async startWatching() {
    console.log('👁️ Starting simple progress watcher for DoD report generation...');
    console.log('📊 Monitoring progress file for real-time updates...');
    console.log('⏰ General ETA: 15 minutes - Report generation in progress\n');
    
    this.isWatching = true;
    
    // Initial progress check
    await this.checkProgress();
    
    // Set up polling every 2 seconds
    this.watchInterval = setInterval(async () => {
      await this.checkProgress();
    }, 2000);
  }

  async checkProgress() {
    try {
      if (!existsSync(this.progressFile)) {
        return;
      }

      const progressData = JSON.parse(readFileSync(this.progressFile, 'utf8'));
      const progress = Math.round(progressData.progress);
      const step = progressData.currentStep;
      const status = progressData.status;
      const timestamp = new Date(progressData.timestamp).toLocaleTimeString();

      // Only update if progress changed
      if (progress !== this.lastProgress) {
        this.lastProgress = progress;
        
        // Create progress bar
        const barLength = 50;
        const filledLength = Math.round((progress / 100) * barLength);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        
        // Clear line and display progress
        process.stdout.write('\r\x1b[K');
        process.stdout.write(`📊 DoD Report Progress: [${bar}] ${progress}% | ${step} | ${timestamp}\n`);
        
        if (status === 'COMPLETED') {
          console.log('\n🎉 DoD Report Generation COMPLETED!');
          console.log('📄 Report ready for General review');
          this.stopWatching();
        } else if (status === 'FAILED') {
          console.log('\n❌ DoD Report Generation FAILED!');
          this.stopWatching();
        }
      }
    } catch (error) {
      // Progress file might not exist yet or be malformed, that's okay
      if (error.code !== 'ENOENT') {
        console.error('Progress watcher error:', error.message);
      }
    }
  }

  stopWatching() {
    this.isWatching = false;
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }
    console.log('👁️ Progress watcher stopped');
  }
}

// Start the watcher
const watcher = new SimpleProgressWatcher();
watcher.startWatching().catch(console.error);

// Handle cleanup on exit
process.on('SIGINT', () => {
  watcher.stopWatching();
  process.exit(0);
});

process.on('SIGTERM', () => {
  watcher.stopWatching();
  process.exit(0);
});
