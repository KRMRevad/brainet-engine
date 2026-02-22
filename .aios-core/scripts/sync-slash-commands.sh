#!/bin/bash
# BRAINET Engine - Slash Commands Synchronization & Validation
# Version: 3.0.0 DEFINITIVE FIX
# Purpose: Ensure slash commands are correctly configured in Claude Code
# Usage: bash .aios-core/scripts/sync-slash-commands.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "════════════════════════════════════════════════════════════════"
echo "BRAINET AIOS - Slash Commands Synchronization v3.0"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# ════════════════════════════════════════════════════════════════════
# STEP 1: Validate Workflow Files Exist
# ════════════════════════════════════════════════════════════════════
echo "[STEP 1] 📂 Validating workflow files..."

AGENTS=("aios-master" "analyst" "architect" "data-engineer" "dev" "devops" "pm" "po" "qa" "sm" "squad-creator" "ux-design-expert")
MISSING_FILES=()

for agent in "${AGENTS[@]}"; do
  if [ -f ".agent/workflows/${agent}.md" ]; then
    size=$(wc -c < ".agent/workflows/${agent}.md")
    echo "  ✅ ${agent}.md (${size} bytes)"
  else
    echo "  ❌ MISSING: ${agent}.md"
    MISSING_FILES+=("${agent}.md")
    ((ERRORS++))
  fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo ""
  echo "  ${RED}ERROR: Missing ${#MISSING_FILES[@]} workflow file(s)${NC}"
  exit 1
fi

echo "  ${GREEN}✓ All 12 workflow files present${NC}"
echo ""

# ════════════════════════════════════════════════════════════════════
# STEP 2: Validate Configuration Files
# ════════════════════════════════════════════════════════════════════
echo "[STEP 2] ⚙️  Validating configuration files..."

if [ -f ".claude/settings.json" ]; then
  echo "  ✅ .claude/settings.json exists"
  if grep -q '"slashCommands"' ".claude/settings.json"; then
    echo "  ✅ slashCommands configuration found"
  else
    echo "  ${YELLOW}⚠️  WARNING: slashCommands not configured in settings.json${NC}"
    ((WARNINGS++))
  fi
else
  echo "  ${RED}❌ CRITICAL: .claude/settings.json not found${NC}"
  ((ERRORS++))
fi

if [ -f ".claude/slash-commands.json" ]; then
  echo "  ✅ .claude/slash-commands.json exists"
else
  echo "  ${YELLOW}⚠️  WARNING: .claude/slash-commands.json not found (YAML fallback available)${NC}"
  ((WARNINGS++))
fi

if [ -f ".claude/slash-commands.yaml" ]; then
  echo "  ✅ .claude/slash-commands.yaml exists (PRIMARY REGISTRY)"
else
  echo "  ${RED}❌ CRITICAL: .claude/slash-commands.yaml not found${NC}"
  ((ERRORS++))
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# STEP 3: Validate Configuration Content
# ════════════════════════════════════════════════════════════════════
echo "[STEP 3] 🔍 Validating configuration content..."

# Check if YAML has all 12 agents
if [ -f ".claude/slash-commands.yaml" ]; then
  agent_count=$(grep -c "id: " ".claude/slash-commands.yaml" || echo 0)
  echo "  Found ${agent_count} agents in YAML registry"
  if [ "$agent_count" -eq 12 ]; then
    echo "  ${GREEN}✓ All 12 agents registered in YAML${NC}"
  else
    echo "  ${RED}❌ ERROR: Expected 12 agents, found ${agent_count}${NC}"
    ((ERRORS++))
  fi
fi

# Check if JSON has all 12 agents
if [ -f ".claude/slash-commands.json" ]; then
  agent_count=$(jq '.commands | length' ".claude/slash-commands.json" 2>/dev/null || echo 0)
  echo "  Found ${agent_count} agents in JSON registry"
  if [ "$agent_count" -eq 12 ]; then
    echo "  ${GREEN}✓ All 12 agents registered in JSON${NC}"
  else
    echo "  ${YELLOW}⚠️  WARNING: Expected 12 agents, found ${agent_count} in JSON${NC}"
    ((WARNINGS++))
  fi
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# STEP 4: Check for macOS Interference Files
# ════════════════════════════════════════════════════════════════════
echo "[STEP 4] 🍎 Checking for macOS interference files..."

BAD_FILES=$(find .claude -name "._*" 2>/dev/null | wc -l)

if [ "$BAD_FILES" -gt 0 ]; then
  echo "  ${YELLOW}⚠️  Found $BAD_FILES interference file(s)${NC}"
  echo "  Removing..."
  rm -f .claude/._*
  echo "  ${GREEN}✓ Cleaned${NC}"
  ((WARNINGS++))
else
  echo "  ${GREEN}✓ No interference files${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════════
# STEP 5: Permission Check
# ════════════════════════════════════════════════════════════════════
echo "[STEP 5] 🔐 Checking file permissions..."

for agent in "${AGENTS[@]}"; do
  if [ -r ".agent/workflows/${agent}.md" ]; then
    echo "  ✅ ${agent}.md is readable"
  else
    echo "  ${RED}❌ ERROR: ${agent}.md is not readable${NC}"
    ((ERRORS++))
  fi
done

echo ""

# ════════════════════════════════════════════════════════════════════
# FINAL REPORT
# ════════════════════════════════════════════════════════════════════
echo "════════════════════════════════════════════════════════════════"
echo "FINAL REPORT"
echo "════════════════════════════════════════════════════════════════"
echo ""

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo "${GREEN}✅ ALL CHECKS PASSED${NC}"
  echo ""
  echo "Slash commands configuration is healthy!"
  echo ""
  echo "📌 NEXT STEP:"
  echo "   1. Restart Claude Code completely (close and reopen)"
  echo "   2. Try running a slash command: /dev, /architect, etc."
  echo "   3. If still not working, check internet connection"
  echo ""
  exit 0
elif [ "$ERRORS" -eq 0 ]; then
  echo "${YELLOW}⚠️  CHECKS PASSED WITH WARNINGS (${WARNINGS})${NC}"
  echo ""
  echo "Most things are OK, but some warnings were found."
  exit 0
else
  echo "${RED}❌ CHECKS FAILED (${ERRORS} errors, ${WARNINGS} warnings)${NC}"
  echo ""
  echo "Please fix the errors above and run this script again."
  exit 1
fi
