/**
 * Progress Tracker for DoD Report Generation
 * 
 * This module tracks report generation progress in SQLite database
 * and provides real-time progress updates for command oversight.
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { join } from 'path';

class ProgressTracker {
  constructor() {
    this.dbPath = join(process.cwd(), 'test-results', 'progress_tracker.db');
    this.reportId = `report_${Date.now()}`;
  }

  async initialize() {
    console.log('📊 Initializing progress tracker database...');
    
    const db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    // Create progress tracking table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS report_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT NOT NULL,
        progress_percentage REAL NOT NULL,
        current_step TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'IN_PROGRESS'
      )
    `);

    await db.close();
    console.log('✅ Progress tracker database initialized');
  }

  async updateProgress(percentage, step, status = 'IN_PROGRESS') {
    const db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    await db.run(
      'INSERT INTO report_progress (report_id, progress_percentage, current_step, status) VALUES (?, ?, ?, ?)',
      [this.reportId, percentage, step, status]
    );

    await db.close();
  }

  async getLatestProgress() {
    const db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    const result = await db.get(
      'SELECT * FROM report_progress WHERE report_id = ? ORDER BY timestamp DESC LIMIT 1',
      [this.reportId]
    );

    await db.close();
    return result;
  }

  async getAllProgress() {
    const db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    const results = await db.all(
      'SELECT * FROM report_progress WHERE report_id = ? ORDER BY timestamp ASC',
      [this.reportId]
    );

    await db.close();
    return results;
  }
}

export { ProgressTracker };
