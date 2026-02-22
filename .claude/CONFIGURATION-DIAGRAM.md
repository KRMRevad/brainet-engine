# BRAINET Slash Commands - Architecture Diagram

## How It Works Now (DEFINITIVE FIX - 2026-02-21)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE                              │
│            User types "/" → Autocomplete appears            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─→ Load Configuration: .claude/settings.json
                 │   │
                 │   └─→ "registry": [
                 │        ".claude/slash-commands.yaml",    ← PRIMARY
                 │        ".claude/slash-commands.json"     ← FALLBACK
                 │       ]
                 │
                 ├─→ Try Primary Registry: .claude/slash-commands.yaml
                 │   │
                 │   ├─→ SUCCESS ✅ → Load all 12 agents
                 │   │
                 │   └─→ FAIL → Try Fallback Registry (below)
                 │
                 └─→ Try Fallback Registry: .claude/slash-commands.json
                     │
                     └─→ Load all 12 agents ✅
```

## File Structure & Flow

```
Project Root/
│
├── .claude/
│   ├── CLAUDE.md
│   │   └─ Single source of truth (architecture, rules)
│   │
│   ├── settings.json
│   │   └─ UPDATED: Now specifies BOTH registries
│   │      {
│   │        "slashCommands": {
│   │          "registry": [
│   │            ".claude/slash-commands.yaml",
│   │            ".claude/slash-commands.json"
│   │          ],
│   │          ...
│   │        }
│   │      }
│   │
│   ├── slash-commands.yaml ⭐ PRIMARY REGISTRY
│   │   └─ 12 agents defined in YAML format
│   │      - id: dev
│   │      - path: .agent/workflows/dev.md
│   │      - aliases: [@dev, /dev]
│   │      ...etc x12
│   │
│   ├── slash-commands.json (FALLBACK)
│   │   └─ Same 12 agents in JSON format
│   │
│   ├── SLASH-COMMANDS-CHECKLIST.md
│   │   └─ Quick troubleshooting guide
│   │
│   └── CONFIGURATION-DIAGRAM.md (this file)
│       └─ Visual explanation
│
├── .agent/
│   └── workflows/
│       ├── aios-master.md
│       ├── dev.md
│       ├── architect.md
│       ├── qa.md
│       ├── pm.md
│       ├── po.md
│       ├── sm.md
│       ├── analyst.md
│       ├── devops.md
│       ├── data-engineer.md
│       ├── ux-design-expert.md
│       ├── squad-creator.md
│       └── README.md
│
└── .aios-core/
    └── scripts/
        ├── sync-slash-commands.sh 🔧 VALIDATION SCRIPT
        │   └─ Auto-validates all 12 workflows + configs
        │      ✅ Checks all files exist
        │      ✅ Verifies permissions
        │      ✅ Validates configuration content
        │      ✅ Removes macOS interference
        │      ✅ Reports diagnostics
        │
        ├── SLASH-COMMANDS-README.md
        │   └─ Complete documentation
        │
        └── (other scripts...)
```

## Redundancy Architecture

```
┌─────────────────────────────────────────────────────┐
│         CLAUDE CODE SLASH COMMAND SYSTEM             │
│                    (RESILIENT)                       │
└──────────────┬──────────────────────────────────────┘
               │
     ┌─────────┴──────────┐
     │                    │
     ▼                    ▼
┌──────────────┐   ┌──────────────┐
│   PRIMARY    │   │   FALLBACK   │
│    YAML      │   │    JSON      │
│   Registry   │   │   Registry   │
│              │   │              │
│ .yaml (139L) │   │ .json (82L)  │
│              │   │              │
│ 12 Agents ✓  │   │ 12 Agents ✓  │
└──────┬───────┘   └──────┬───────┘
       │                  │
       └──────────┬───────┘
                  │
       ┌──────────▼──────────┐
       │  Load successfully   │
       │  Display in Claude   │
       │  Code autocomplete   │
       └─────────────────────┘
```

## Validation Flow

```
User runs: bash .aios-core/scripts/sync-slash-commands.sh
                            │
                    ┌───────┴────────┐
                    │                │
         ┌──────────▼──────────┐    │
         │ STEP 1: Check Files │    │
         │ (12 workflows exist)│    │
         └──────────┬──────────┘    │
                    │               │
         ┌──────────▼──────────┐    │
         │ STEP 2: Configs OK? │    │
         │ (settings.json)     │    │
         └──────────┬──────────┘    │
                    │               │
         ┌──────────▼──────────┐    │
         │ STEP 3: 12 Agents?  │    │
         │ (in YAML + JSON)    │    │
         └──────────┬──────────┘    │
                    │               │
         ┌──────────▼──────────┐    │
         │ STEP 4: Clean up    │    │
         │ (remove ._* files)  │    │
         └──────────┬──────────┘    │
                    │               │
         ┌──────────▼──────────┐    │
         │ STEP 5: Permissions │    │
         │ (all readable?)     │    │
         └──────────┬──────────┘    │
                    │               │
              ┌─────▼─────┐
              │  ALL OK ✅ │
              │ or ERRORS  │
              │ (reported) │
              └───────────┘
```

## Why This Fix Is Definitive

### Before (Single Point of Failure)
```
Claude Code
    │
    └── .claude/settings.json (ONLY registry)
        │
        └── .claude/slash-commands.json
            │
            └── IF FILE BROKEN → NO COMMANDS
```

### After (Redundant & Validated)
```
Claude Code
    │
    └── .claude/settings.json
        │
        ├── PRIMARY: .claude/slash-commands.yaml ✓
        │   └─ IF WORKS → Use this
        │
        └── FALLBACK: .claude/slash-commands.json ✓
            └─ IF PRIMARY FAILS → Use this

PLUS:
    └── .aios-core/scripts/sync-slash-commands.sh
        └─ Auto-validates everything
           └─ Prevents silent failures
```

## Recovery Procedure

```
Problem: Commands missing
         │
         ├─→ Run: bash .aios-core/scripts/sync-slash-commands.sh
         │        │
         │        ├─→ Shows errors (if any)
         │        ├─→ Cleans interference
         │        └─→ Reports status
         │
         └─→ Restart Claude Code
            └─→ Commands appear ✅
```

## Key Improvements (2026-02-21)

| Aspect | Before | After |
|--------|--------|-------|
| Registry | Single (JSON) | Dual (YAML + JSON) |
| Failure Mode | Silent | Visible (via script) |
| Validation | Manual | Automated |
| Documentation | Minimal | Comprehensive |
| Recovery | Unknown | Clear procedure |
| Maintenance | Error-prone | Self-validating |

---

**This architecture ensures slash commands work reliably and provides clear debugging paths if issues arise.**

*BRAINET Engine · Synkra AIOS · Definitive Fix Applied 2026-02-21*
