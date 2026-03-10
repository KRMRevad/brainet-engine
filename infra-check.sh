#!/bin/bash

##############################################
# EVAD Infrastructure Health Check
# Mission: Infinite Mosaic Foundation
# Last Run: $(date)
##############################################

set -e

PROJECT_ROOT="/Users/kreligar3vad/Documents/Workspace/apps/brainet"
LOG_FILE="$PROJECT_ROOT/.infra-check.log"

echo "========================================" | tee -a "$LOG_FILE"
echo "🔍 EVAD INFRASTRUCTURE HEALTH CHECK" | tee -a "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_port() {
  local host=$1
  local port=$2
  local name=$3

  echo "" | tee -a "$LOG_FILE"
  echo "📡 Checking $name ($host:$port)..." | tee -a "$LOG_FILE"

  if timeout 3 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
    echo -e "${GREEN}✓ $name is UP${NC}" | tee -a "$LOG_FILE"
    return 0
  else
    echo -e "${RED}✗ $name is DOWN${NC}" | tee -a "$LOG_FILE"
    return 1
  fi
}

check_curl() {
  local url=$1
  local name=$2

  echo "" | tee -a "$LOG_FILE"
  echo "🌐 Testing $name ($url)..." | tee -a "$LOG_FILE"

  if response=$(curl -s -I -m 3 "$url" 2>/dev/null | head -1); then
    echo -e "${GREEN}✓ $name responded: $response${NC}" | tee -a "$LOG_FILE"
    return 0
  else
    echo -e "${RED}✗ $name no response${NC}" | tee -a "$LOG_FILE"
    return 1
  fi
}

# 1. TAILSCALE CHECK
echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"
echo "1️⃣  TAILSCALE NETWORK" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"

if command -v tailscale &> /dev/null; then
  echo -e "${GREEN}✓ Tailscale installed${NC}" | tee -a "$LOG_FILE"
  tailscale_status=$(tailscale status 2>&1 || echo "offline")
  echo "$tailscale_status" | tee -a "$LOG_FILE"

  if echo "$tailscale_status" | grep -q "100.66.114.87"; then
    echo -e "${GREEN}✓ Alienware (100.66.114.87) visible${NC}" | tee -a "$LOG_FILE"
  else
    echo -e "${RED}✗ Alienware (100.66.114.87) NOT visible${NC}" | tee -a "$LOG_FILE"
  fi
else
  echo -e "${RED}✗ Tailscale NOT installed${NC}" | tee -a "$LOG_FILE"
fi

# 2. LOCAL SERVICES
echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"
echo "2️⃣  LOCAL SERVICES (MacBook)" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"

check_curl "http://localhost:3000" "Local Server" || true
check_curl "http://localhost:5173" "Vite Dev Server" || true
check_curl "http://localhost:5678" "n8n Instance" || true

# 3. ALIENWARE SERVICES
echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"
echo "3️⃣  ALIENWARE SERVICES (Tailscale)" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"

check_port "100.66.114.87" "3000" "Alienware Server" || true
check_port "100.66.114.87" "5678" "Alienware n8n" || true
check_port "100.66.114.87" "11434" "Alienware Ollama" || true

# 4. CHROME CDP
echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"
echo "4️⃣  CHROME DEBUGGING PROTOCOL (CDP)" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"

if pgrep -f "Chrome.*remote-debugging-port=9225" > /dev/null; then
  echo -e "${GREEN}✓ Chrome CDP is running on :9225${NC}" | tee -a "$LOG_FILE"
  check_curl "http://localhost:9225/json" "Chrome API" || true
else
  echo -e "${YELLOW}⚠ Chrome CDP not running - use 'npm run chrome:debug' to start${NC}" | tee -a "$LOG_FILE"
fi

# 5. N8N WORKFLOWS
echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"
echo "5️⃣  N8N WORKFLOWS" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"

echo "Local n8n workflows:" | tee -a "$LOG_FILE"
ls -lh "$PROJECT_ROOT/n8n/workflows/"*.json 2>/dev/null | awk '{print $9, "(" $5 ")"}' | tee -a "$LOG_FILE"

# 6. ENVIRONMENT
echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"
echo "6️⃣  ENVIRONMENT & DEPENDENCIES" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"

echo "Node: $(node -v)" | tee -a "$LOG_FILE"
echo "npm: $(npm -v)" | tee -a "$LOG_FILE"

if command -v pm2 &> /dev/null; then
  echo "PM2: $(pm2 -v)" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"
  echo "Active PM2 processes:" | tee -a "$LOG_FILE"
  pm2 list 2>/dev/null || echo "No PM2 processes running" | tee -a "$LOG_FILE"
else
  echo -e "${YELLOW}⚠ PM2 not installed globally${NC}" | tee -a "$LOG_FILE"
fi

# SUMMARY
echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"
echo "✅ HEALTH CHECK COMPLETE" | tee -a "$LOG_FILE"
echo "Log saved to: $LOG_FILE" | tee -a "$LOG_FILE"
echo "Timestamp: $(date)" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════" | tee -a "$LOG_FILE"
