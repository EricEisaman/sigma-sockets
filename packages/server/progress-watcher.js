/**
 * Progress Watcher for DoD Report Generation
 * 
 * This process watches the SQLite database for progress updates
 * and displays real-time progress for command oversight.
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { join } from 'path';

class ProgressWatcher {
  constructor() {
    this.dbPath = join(process.cwd(), 'test-results', 'progress_tracker.db');
    this.isWatching = false;
    this.lastProgress = 0;
  }

  async startWatching() {
    console.log('👁️ Starting progress watcher for DoD report generation...');
    console.log('📊 Monitoring progress database for real-time updates...');
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
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      const latest = await db.get(
        'SELECT * FROM report_progress ORDER BY timestamp DESC LIMIT 1'
      );

      await db.close();

      if (latest) {
        const progress = Math.round(latest.progress_percentage);
        const step = latest.current_step;
        const status = latest.status;
        const timestamp = new Date(latest.timestamp).toLocaleTimeString();

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
      }
    } catch (error) {
      // Database might not exist yet, that's okay
      if (error.code !== 'SQLITE_CANTOPEN') {
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
const watcher = new ProgressWatcher();
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
