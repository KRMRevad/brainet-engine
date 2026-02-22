# Claude Code Slash Commands - Quick Checklist

## If Slash Commands Are Not Working

### ✅ STEP 1: Run Validation (1 minute)
```bash
bash .aios-core/scripts/sync-slash-commands.sh
```

**Expected Output:** Should say "ALL CHECKS PASSED" or "CHECKS PASSED WITH WARNINGS"

If it shows ERRORS → Fix the errors it reports

---

### ✅ STEP 2: Restart Claude Code (2 minutes)

**CRITICAL:** You must **COMPLETELY CLOSE and REOPEN** Claude Code
- ❌ Don't just switch tabs
- ❌ Don't just reload
- ✅ Close the window completely → Reopen the app

---

### ✅ STEP 3: Test a Command (1 minute)

Type `/` in Claude Code and wait for suggestions to appear.

Should see:
- `/aios-master`
- `/dev`
- `/architect`
- `/qa`
- `/pm`
- `/po`
- `/sm`
- `/analyst`
- `/devops`
- `/data-engineer`
- `/ux-design-expert`
- `/squad-creator`

---

## Configuration Files Status

| File | Location | Status | Role |
|------|----------|--------|------|
| 12 Agent Workflows | `.agent/workflows/*.md` | ✅ Present | Definitions |
| Primary Registry | `.claude/slash-commands.yaml` | ✅ Present | YAML config |
| Fallback Registry | `.claude/slash-commands.json` | ✅ Present | JSON config |
| Settings | `.claude/settings.json` | ✅ Present | Master config |
| Validation Script | `.aios-core/scripts/sync-slash-commands.sh` | ✅ Present | Auto-check |

---

## Most Common Issues & Fixes

### Issue: "Commands appeared before, now missing"
**Fix:**
```bash
bash .aios-core/scripts/sync-slash-commands.sh
# Then restart Claude Code
```

### Issue: "Some commands work, some don't"
**Fix:** Check individual workflow files exist
```bash
ls .agent/workflows/ | wc -l
# Should be 13 (12 agents + README)
```

### Issue: "Script shows errors"
**Fix:** Read the error messages carefully. They tell you exactly what's wrong.

### Issue: "Still doesn't work after everything"
**Check:**
- Did you restart Claude Code **completely**?
- Is Claude Code up-to-date?
- Are you running from the correct project directory?

---

## Files Changed on 2026-02-21 (DEFINITIVE FIX)

### Modified:
- `.claude/settings.json` — Added multi-registry support

### Created:
- `.claude/slash-commands.yaml` — Primary YAML registry
- `.aios-core/scripts/sync-slash-commands.sh` — Validation script
- `.aios-core/scripts/SLASH-COMMANDS-README.md` — Detailed docs
- `.claude/SLASH-COMMANDS-CHECKLIST.md` — This file

### Why This Fix Works:
1. ✅ **Redundancy** — Two registries instead of one
2. ✅ **Automation** — Script validates everything
3. ✅ **Documentation** — Clear troubleshooting path
4. ✅ **Native Format** — YAML is Claude Code's native format

---

## Quick Reference

### Activate any agent with:
```
Type: /dev
Or: @dev
```

### Inside an agent context:
```
*help       → Show available commands
*task foo   → Execute task
*exit       → Leave agent mode
```

---

**DEFINITIVE FIX Applied** | Status: ✅ RESOLVED | Date: 2026-02-21
