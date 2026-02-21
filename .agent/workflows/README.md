# AIOS Agent Commands

This directory contains activation commands for all Synkra AIOS agents integrated with BRAINET.

## Available Agents (12 Total)

### Core Framework
- **`/aios-master`** — Framework orchestrator, constitutional enforcement

### Development Team
- **`/dev`** — Developer (Dex) - Code implementation
- **`/architect`** — Architect (Aria) - System design & technology selection
- **`/qa`** — QA Specialist - Quality gates & testing
- **`/analyst`** — Business Analyst - Research & requirements analysis
- **`/data-engineer`** — Data Engineer (Dara) - Database design & optimization

### Management Team
- **`/pm`** — Project Manager (Morgan) - Epic orchestration & specs
- **`/po`** — Product Owner (Pax) - Story validation & prioritization
- **`/sm`** — Scrum Master (River) - Story creation & sprint management

### Specialized Roles
- **`/devops`** — DevOps Engineer (Gage) - Repository & release management ⚡ EXCLUSIVE git push
- **`/ux-design-expert`** — UX Design Expert - UI/UX & design systems
- **`/squad-creator`** — Squad Creator - Team composition & multi-agent workflows

## Usage

### Activate an Agent
```
/dev              # Activate Developer
/architect        # Activate Architect
/devops           # Activate DevOps
```

### Agent Commands (when active)
```
*help             # Show all available commands
*exit             # Exit agent mode
```

## Authority Matrix

| Operation | Exclusive Agent |
|-----------|-----------------|
| `git push` | `/devops` |
| `gh pr create` | `/devops` |
| Release creation | `/devops` |
| Story creation | `/sm` |
| Story validation | `/po` |
| Architecture decisions | `/architect` |
| Quality verdicts | `/qa` |

## Quick Start Workflow

1. **Plan Epic** → `/pm *create-epic`
2. **Create Story** → `/sm *draft`
3. **Validate Story** → `/po *validate-story`
4. **Implement** → `/dev *develop`
5. **Quality Gate** → `/qa *qa-gate`
6. **Push & Release** → `/devops *push` then `/devops *release`

## File Structure

Each agent command file contains:
- **Activation** — How to activate the agent
- **Authority** — What decisions this agent can make
- **Quick Access** — Most common commands
- **Description** — When to use this agent

---

**Framework:** Synkra AIOS v3.0 | **Project:** BRAINET MVP
**Last Updated:** 2026-02-21
