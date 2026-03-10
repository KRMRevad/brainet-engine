#!/bin/bash

##############################################################################
# BRAINET Jobs Backup Script
# Temporary backup of jobs.json before DB migration
#
# Purpose:
#   - Creates timestamped backups of server/data/jobs.json
#   - Useful during TD-1.2 migration from JSON to Supabase
#   - To be deprecated once Supabase is validated in production
#
# Usage:
#   ./scripts/backup-jobs.sh                  # Create backup now
#   ./scripts/backup-jobs.sh --schedule cron  # Add to cron (requires setup)
#
# Requirements:
#   - bash 4.0+
#   - mkdir, cp commands
#   - Read access to server/data/jobs.json
#   - Write access to backups/ directory
#
# Notes:
#   - AC-10 (TD-1.2): Temporary measure for data safety during migration
#   - To be removed once DB-01 (Supabase setup) is validated in production
#   - Backups should NOT be version controlled (backups/ in .gitignore)
##############################################################################

set -e  # Exit on any error

# --- CONFIGURATION ---
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JOBS_FILE="$PROJECT_DIR/server/data/jobs.json"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

# --- COLORS ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- FUNCTIONS ---

log_info() {
    echo -e "${GREEN}[BACKUP]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

backup_jobs() {
    # Check if jobs.json exists
    if [ ! -f "$JOBS_FILE" ]; then
        log_error "Jobs file not found: $JOBS_FILE"
        exit 1
    fi

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Create backup with timestamp
    BACKUP_FILE="$BACKUP_DIR/jobs-${DATE}.json"
    BACKUP_FILE_TS="$BACKUP_DIR/jobs-${TIMESTAMP}.json"

    # If today's backup already exists, create timestamped version instead
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_FILE_TS"
    fi

    # Copy jobs.json to backup
    cp "$JOBS_FILE" "$BACKUP_FILE"

    # Get file size for logging
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    JOB_COUNT=$(grep -c '"id":' "$BACKUP_FILE" 2>/dev/null || echo "?")

    log_info "Backup created: $BACKUP_FILE"
    log_info "Size: $SIZE | Jobs: $JOB_COUNT"
}

cleanup_old_backups() {
    # Keep only last 30 days of backups (optional, comment out if not needed)
    DAYS_TO_KEEP=30

    if [ -d "$BACKUP_DIR" ]; then
        log_info "Cleaning up backups older than $DAYS_TO_KEEP days..."
        find "$BACKUP_DIR" -name "jobs-*.json" -mtime +$DAYS_TO_KEEP -delete
    fi
}

verify_backup() {
    # Verify backup is valid JSON
    if command -v jq &> /dev/null; then
        if jq empty "$BACKUP_FILE" 2>/dev/null; then
            log_info "✓ Backup is valid JSON"
        else
            log_error "✗ Backup is NOT valid JSON"
            exit 1
        fi
    else
        log_warn "jq not found, skipping JSON validation"
    fi
}

status() {
    log_info "Backup Status for $(date)"

    if [ ! -d "$BACKUP_DIR" ]; then
        log_warn "No backups found"
        exit 0
    fi

    echo ""
    echo "Recent backups:"
    ls -lh "$BACKUP_DIR"/jobs-*.json 2>/dev/null | tail -5 || log_warn "No backup files found"

    echo ""
    echo "Total backup size: $(du -sh "$BACKUP_DIR" 2>/dev/null || echo 'N/A')"
    echo "Total files: $(find "$BACKUP_DIR" -name "jobs-*.json" 2>/dev/null | wc -l)"
}

# --- MAIN ---

case "${1:-backup}" in
    backup)
        log_info "Starting backup..."
        backup_jobs
        verify_backup
        cleanup_old_backups
        log_info "Backup complete!"
        ;;
    status)
        status
        ;;
    --schedule|cron)
        log_warn "Cron scheduling not yet automated"
        log_warn "To schedule daily backups, add to crontab:"
        echo "  0 2 * * * cd $PROJECT_DIR && bash scripts/backup-jobs.sh backup"
        ;;
    *)
        cat << EOF
BRAINET Jobs Backup Script

Usage: ./scripts/backup-jobs.sh [COMMAND]

Commands:
  backup          Create a backup of jobs.json (default)
  status          Show backup status and recent files
  --schedule cron Show cron setup instructions

Environment:
  JOBS_FILE:      $JOBS_FILE
  BACKUP_DIR:     $BACKUP_DIR

Notes:
  - Backups are timestamped: jobs-YYYY-MM-DD.json
  - Old backups (>30 days) are automatically cleaned up
  - Requires valid JSON in server/data/jobs.json
  - Part of TD-1.2: Temporary migration safety measure

Examples:
  ./scripts/backup-jobs.sh              # Create backup now
  ./scripts/backup-jobs.sh status       # Check backup status
  ./scripts/backup-jobs.sh --schedule   # Show cron instructions

EOF
        ;;
esac
