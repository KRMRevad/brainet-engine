# BRAINET Slash Commands - Configuration & Troubleshooting

## Overview

This directory contains scripts for managing AIOS Agent slash commands in Claude Code.

## Current Status ✅

**All 12 AIOS Agent commands are configured and ready to use:**

| Command | Agent | Activation |
|---------|-------|------------|
| `/dev` | Developer | `/dev` or `@dev` |
| `/architect` | Architect | `/architect` or `@architect` |
| `/qa` | Quality Assurance | `/qa` or `@qa` |
| `/pm` | Project Manager | `/pm` or `@pm` |
| `/po` | Product Owner | `/po` or `@po` |
| `/sm` | Scrum Master | `/sm` or `@sm` |
| `/analyst` | Business Analyst | `/analyst` or `@analyst` |
| `/devops` | DevOps Engineer | `/devops` or `@devops` |
| `/data-engineer` | Data Engineer | `/data-engineer` or `@data-engineer` |
| `/ux-design-expert` | UX Design Expert | `/ux-design-expert` or `@ux-design-expert` |
| `/squad-creator` | Squad Creator | `/squad-creator` or `@squad-creator` |
| `/aios-master` | Master Orchestrator | `/aios-master` or `@aios-master` |

## Files & Configuration

### Configuration Files
- **`.claude/settings.json`** — Main Claude Code settings (includes slash command registry)
- **`.claude/slash-commands.yaml`** — PRIMARY registry (YAML format, native to Claude Code)
- **`.claude/slash-commands.json`** — Fallback registry (JSON format, redundancy)
- **`.agent/workflows/`** — Directory containing all 12 agent workflow definitions

### Workflow Files
All agent definitions are stored in `.agent/workflows/`:
```
.agent/workflows/
├── aios-master.md
├── analyst.md
├── architect.md
├── data-engineer.md
├── dev.md
├── devops.md
├── pm.md
├── po.md
├── qa.md
├── sm.md
├── squad-creator.md
└── ux-design-expert.md
```

## Troubleshooting

### Problem: Slash commands don't appear in autocomplete

**Solution 1: Run validation script**
```bash
bash .aios-core/scripts/sync-slash-commands.sh
```

This script will:
- ✅ Validate all 12 workflow files exist
- ✅ Check configuration files are present
- ✅ Verify agent registrations
- ✅ Remove macOS interference files
- ✅ Check file permissions

**Solution 2: Restart Claude Code**
After running the validation script, **completely close and reopen Claude Code** (not just switching tabs).

**Solution 3: Manual check**

1. Verify workflow files exist:
   ```bash
   ls -la .agent/workflows/*.md | wc -l
   # Should output: 13 (12 agents + README)
   ```

2. Verify configuration files:
   ```bash
   ls -la .claude/slash-commands.*
   # Should show both .yaml and .json files
   ```

3. Check settings.json has slash commands enabled:
   ```bash
   grep -A 3 '"slashCommands"' .claude/settings.json
   ```

### Problem: Only some commands work

This might indicate an issue with the specific workflow file. Check:
```bash
cat .agent/workflows/{agent-name}.md | head -10
```

The file should start with `# {Agent Name}` and include activation syntax.

### Problem: Commands appeared before but now gone

Run the sync script:
```bash
bash .aios-core/scripts/sync-slash-commands.sh
```

Then restart Claude Code.

## DEFINITIVE FIX Applied (2026-02-21)

### What was fixed:
1. **Single Point of Failure** → Multi-registry redundancy
   - Registry now accepts array: `[".claude/slash-commands.yaml", ".claude/slash-commands.json"]`

2. **macOS Interference** → Cleaned
   - Removed `._*` files that were blocking configuration

3. **Validation** → Automated
   - Script validates everything and provides clear diagnostics

### Why this fix is definitive:
- ✅ **Redundancy:** If one registry fails, fallback exists
- ✅ **Automation:** Sync script prevents manual errors
- ✅ **Clarity:** `.yaml` is now primary (native Claude Code format)
- ✅ **Documentation:** This README + sync script = no mysteries
- ✅ **Persistence:** Configuration committed to git

## How to Use Slash Commands

Once configured, simply type `/` in Claude Code and wait for autocomplete suggestions:

```
/dev        → Activate Developer Agent
/architect  → Activate Architect Agent
/qa         → Activate QA Agent
...etc
```

Or use `@` syntax:
```
@dev        → Activate Developer Agent (alternative syntax)
```

## Maintenance

To keep slash commands working:
1. Don't delete `.agent/workflows/*.md` files
2. Don't modify `.claude/settings.json` registry path without reason
3. Run sync script if any configuration issues appear:
   ```bash
   bash .aios-core/scripts/sync-slash-commands.sh
   ```

## Related Documentation

- **Agent System:** See `.aios-core/development/agents/` for individual agent details
- **AIOS Framework:** See `.aios-core/constitution.md` for framework principles
- **Claude Code Config:** See `.claude/CLAUDE.md` (section 6: Workflow Execution)

---

*BRAINET Engine · Synkra AIOS · Last Updated: 2026-02-21*
