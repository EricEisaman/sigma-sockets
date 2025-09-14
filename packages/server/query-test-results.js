#!/usr/bin/env node

/**
 * Query WebSocket Test Results from SQLite Database
 * 
 * This script allows you to review test results from the SQLite database
 * even after the test process has been killed.
 */

import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

class TestResultsQuery {
  constructor() {
    this.dbPath = './test-results/websocket_tests.db';
  }

  async connect() {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.dbPath)) {
        reject(new Error(`Database not found at ${this.dbPath}`));
        return;
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Connected to test results database');
          resolve();
        }
      });
    });
  }

  async getAllTestSessions() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          id,
          start_time,
          end_time,
          total_tests,
          successful_tests,
          success_rate,
          total_duration,
          created_at
        FROM test_sessions 
        ORDER BY created_at DESC
      `;
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getTestResults(sessionId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          test_name,
          success,
          duration,
          details,
          created_at
        FROM test_results 
        WHERE session_id = ?
        ORDER BY created_at ASC
      `;
      
      this.db.all(sql, [sessionId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getServerMetrics(sessionId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          test_name,
          metric_name,
          metric_value,
          created_at
        FROM server_metrics 
        WHERE session_id = ?
        ORDER BY created_at ASC
      `;
      
      this.db.all(sql, [sessionId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getOverallStatistics() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_sessions,
          AVG(success_rate) as avg_success_rate,
          AVG(total_duration) as avg_duration,
          MIN(created_at) as first_test,
          MAX(created_at) as last_test
        FROM test_sessions
      `;
      
      this.db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  formatDuration(ms) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  async printAllSessions() {
    console.log('\n📊 ALL TEST SESSIONS');
    console.log('='.repeat(80));
    
    const sessions = await this.getAllTestSessions();
    
    if (sessions.length === 0) {
      console.log('No test sessions found in database.');
      return;
    }
    
    sessions.forEach((session, index) => {
      console.log(`\n${index + 1}. Session: ${session.id}`);
      console.log(`   Date: ${this.formatTimestamp(session.created_at)}`);
      console.log(`   Tests: ${session.successful_tests}/${session.total_tests} (${session.success_rate.toFixed(1)}%)`);
      console.log(`   Duration: ${this.formatDuration(session.total_duration)}`);
    });
  }

  async printSessionDetails(sessionId) {
    console.log(`\n📋 DETAILED RESULTS FOR SESSION: ${sessionId}`);
    console.log('='.repeat(80));
    
    const [testResults, serverMetrics] = await Promise.all([
      this.getTestResults(sessionId),
      this.getServerMetrics(sessionId)
    ]);
    
    console.log('\n🧪 Test Results:');
    testResults.forEach((test, index) => {
      console.log(`\n  ${index + 1}. ${test.success ? '✅' : '❌'} ${test.test_name}`);
      console.log(`     Duration: ${test.duration}ms`);
      console.log(`     Details: ${test.details}`);
      console.log(`     Time: ${this.formatTimestamp(test.created_at)}`);
    });
    
    if (serverMetrics.length > 0) {
      console.log('\n📊 Server Metrics:');
      serverMetrics.forEach((metric, index) => {
        console.log(`\n  ${index + 1}. ${metric.test_name} - ${metric.metric_name}`);
        try {
          const value = JSON.parse(metric.metric_value);
          console.log(`     Value: ${JSON.stringify(value, null, 2)}`);
        } catch {
          console.log(`     Value: ${metric.metric_value}`);
        }
        console.log(`     Time: ${this.formatTimestamp(metric.created_at)}`);
      });
    }
  }

  async printOverallStats() {
    console.log('\n📈 OVERALL STATISTICS');
    console.log('='.repeat(80));
    
    const stats = await this.getOverallStatistics();
    
    console.log(`Total Test Sessions: ${stats.total_sessions}`);
    console.log(`Average Success Rate: ${stats.avg_success_rate?.toFixed(1) || 0}%`);
    console.log(`Average Duration: ${this.formatDuration(stats.avg_duration || 0)}`);
    console.log(`First Test: ${this.formatTimestamp(stats.first_test)}`);
    console.log(`Last Test: ${this.formatTimestamp(stats.last_test)}`);
  }

  async close() {
    if (this.db) {
      this.db.close();
      console.log('✅ Database connection closed');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const sessionId = args[1];

  try {
    const query = new TestResultsQuery();
    await query.connect();

    switch (command) {
      case 'sessions':
        await query.printAllSessions();
        break;
        
      case 'details':
        if (!sessionId) {
          console.log('Usage: node query-test-results.js details <session-id>');
          console.log('Run "node query-test-results.js sessions" to see available session IDs');
          process.exit(1);
        }
        await query.printSessionDetails(sessionId);
        break;
        
      case 'stats':
        await query.printOverallStats();
        break;
        
      case 'latest':
        const sessions = await query.getAllTestSessions();
        if (sessions.length > 0) {
          await query.printSessionDetails(sessions[0].id);
        } else {
          console.log('No test sessions found.');
        }
        break;
        
      default:
        console.log('WebSocket Test Results Query Tool');
        console.log('==================================');
        console.log('');
        console.log('Usage:');
        console.log('  node query-test-results.js sessions     - List all test sessions');
        console.log('  node query-test-results.js details <id> - Show detailed results for a session');
        console.log('  node query-test-results.js latest       - Show latest test results');
        console.log('  node query-test-results.js stats        - Show overall statistics');
        console.log('');
        console.log('Examples:');
        console.log('  node query-test-results.js sessions');
        console.log('  node query-test-results.js details test_1757853439024');
        console.log('  node query-test-results.js latest');
        console.log('  node query-test-results.js stats');
        break;
    }

    await query.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the query tool
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
