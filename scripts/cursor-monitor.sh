#!/bin/bash

# Cursor Monitor Script
# This script runs outside of Cursor and monitors the project every 5 minutes
# to trigger improvement cycles and TODO re-evaluation

set -e

# Configuration
PROJECT_DIR="/Users/eeisaman/Documents/SIGMA PRODUCTIONS/sigma-sockets"
CURSOR_APP="/Applications/Cursor.app"
MONITOR_INTERVAL=300  # 5 minutes in seconds
LOG_FILE="$PROJECT_DIR/.cursor-monitor.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Error logging function
log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

# Success logging function
log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

# Warning logging function
log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if Cursor is running
is_cursor_running() {
    pgrep -f "Cursor" > /dev/null 2>&1
}

# Start Cursor if not running
start_cursor() {
    if ! is_cursor_running; then
        log "Starting Cursor..."
        open -a "$CURSOR_APP" "$PROJECT_DIR"
        sleep 5
        if is_cursor_running; then
            log_success "Cursor started successfully"
        else
            log_error "Failed to start Cursor"
            return 1
        fi
    else
        log "Cursor is already running"
    fi
}

# Run improvement cycle
run_improvement_cycle() {
    log "🔄 Running improvement cycle..."
    
    cd "$PROJECT_DIR"
    
    # Run the radical completion monitor trigger
    if node scripts/radical-completion-monitor.js trigger; then
        log_success "Improvement cycle completed successfully"
    else
        log_error "Improvement cycle failed"
    fi
    
    # TRIGGER AI TO ACTUALLY WORK ON TODOs
    log "🤖 Triggering AI to work on TODOs..."
    if node scripts/cursor-ai-trigger.js trigger; then
        log_success "AI trigger sent successfully"
    else
        log_error "AI trigger failed"
    fi
    
    # ACTUALLY WORK ON TODOs
    log "🔧 Working on highest priority TODO..."
    if node scripts/work-on-todos.js work; then
        log_success "TODO work completed"
    else
        log_error "TODO work failed"
    fi
}

# Re-evaluate TODOs
reevaluate_todos() {
    log "📋 Re-evaluating TODOs..."
    
    cd "$PROJECT_DIR"
    
    # Run TODO manager to update and analyze
    if node scripts/todo-manager.js dashboard; then
        log_success "TODO re-evaluation completed"
    else
        log_error "TODO re-evaluation failed"
    fi
}

# Check project health
check_project_health() {
    log "🔍 Checking project health..."
    
    cd "$PROJECT_DIR"
    
    # Run type check
    if npm run type-check > /dev/null 2>&1; then
        log_success "Type check passed"
    else
        log_warning "Type check failed - may need attention"
    fi
    
    # Run lint check
    if npm run lint > /dev/null 2>&1; then
        log_success "Lint check passed"
    else
        log_warning "Lint check failed - may need attention"
    fi
    
    # Run tests
    if npm run test > /dev/null 2>&1; then
        log_success "Tests passed"
    else
        log_warning "Tests failed - may need attention"
    fi
}

# Main monitoring loop
monitor_loop() {
    log "🚀 Starting Cursor Monitor..."
    log "📁 Project directory: $PROJECT_DIR"
    log "⏰ Monitor interval: $MONITOR_INTERVAL seconds"
    log "📝 Log file: $LOG_FILE"
    
    # Start Cursor if not running
    start_cursor
    
    # Initial improvement cycle
    run_improvement_cycle
    
    # Main loop
    while true; do
        log "⏰ Starting monitoring cycle..."
        
        # Check if Cursor is still running
        if ! is_cursor_running; then
            log_warning "Cursor is not running, restarting..."
            start_cursor
        fi
        
        # Run improvement cycle
        run_improvement_cycle
        
        # Re-evaluate TODOs
        reevaluate_todos
        
        # Check project health
        check_project_health
        
        log "✅ Monitoring cycle completed. Waiting $MONITOR_INTERVAL seconds..."
        sleep "$MONITOR_INTERVAL"
    done
}

# Handle script interruption
cleanup() {
    log "🛑 Cursor Monitor stopped by user"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    CURSOR MONITOR                           ║"
    echo "║                                                              ║"
    echo "║  This script will:                                           ║"
    echo "║  • Start Cursor if not running                              ║"
    echo "║  • Run improvement cycles every 5 minutes                  ║"
    echo "║  • Re-evaluate TODOs automatically                          ║"
    echo "║  • Monitor project health                                   ║"
    echo "║                                                              ║"
    echo "║  Press Ctrl+C to stop                                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check if project directory exists
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "Project directory does not exist: $PROJECT_DIR"
        exit 1
    fi
    
    # Check if Cursor app exists
    if [ ! -d "$CURSOR_APP" ]; then
        log_error "Cursor app not found at: $CURSOR_APP"
        exit 1
    fi
    
    # Start monitoring
    monitor_loop
}

# Run main function
main "$@"
