# AIOS Agent Command Reference

> **Framework:** Synkra AIOS v3.0 | **Workspace:** BRAINET Engine

This file documents how to activate and use AIOS agents in Claude Code.

## Quick Start

### Activation Methods

**Option 1: Slash Commands (Recommended)**
```
/dev
/architect
/qa
/pm
/po
/sm
/analyst
/devops
/data-engineer
/ux-design-expert
/squad-creator
/aios-master
```

**Option 2: @ Syntax**
```
@dev
@architect
@qa
(etc...)
```

### Agent Commands

Once an agent is activated, use these commands:

```
*help                    Show available commands for this agent
*task {name}            Execute specific task
*exit                   Exit agent mode
*workflow {name}        Run specific workflow
```

---

## All 12 Agents

### 🎯 Master Orchestrator
- **Command:** `/aios-master`
- **Role:** Central coordination of all agents
- **Authority:** Delegates work, makes meta-decisions
- **Workflow:** `.agent/workflows/aios-master.md`

### 👨‍💻 Developer
- **Command:** `/dev`
- **Role:** Code implementation, testing, debugging
- **Authority:** Write code, create tests
- **Workflow:** `.agent/workflows/dev.md`

### 🏗️ Architect
- **Command:** `/architect`
- **Role:** System design, architecture decisions
- **Authority:** Make non-negotiable architecture decisions ⚠️
- **Workflow:** `.agent/workflows/architect.md`

### ✅ Quality Assurance
- **Command:** `/qa`
- **Role:** Testing, quality verification, verdicts
- **Authority:** Issue non-negotiable quality verdicts ⚠️
- **Workflow:** `.agent/workflows/qa.md`

### 📅 Project Manager
- **Command:** `/pm`
- **Role:** Planning, coordination, timelines
- **Authority:** Plan projects, track progress
- **Workflow:** `.agent/workflows/pm.md`

### 📦 Product Owner
- **Command:** `/po`
- **Role:** Vision, requirements, story creation
- **Authority:** Create stories (non-negotiable) ⚠️
- **Workflow:** `.agent/workflows/po.md`

### 🏃 Scrum Master
- **Command:** `/sm`
- **Role:** Process, sprint management, facilitation
- **Authority:** Create stories (non-negotiable) ⚠️
- **Workflow:** `.agent/workflows/sm.md`

### 📊 Business Analyst
- **Command:** `/analyst`
- **Role:** Requirements, analysis, impact assessment
- **Authority:** Analyze requirements, identify gaps
- **Workflow:** `.agent/workflows/analyst.md`

### 🚀 DevOps Engineer
- **Command:** `/devops`
- **Role:** Deployment, infrastructure, releases
- **Authority:** git push, create PRs, releases (non-negotiable) ⚠️
- **Workflow:** `.agent/workflows/devops.md`

### 🗄️ Data Engineer
- **Command:** `/data-engineer`
- **Role:** Data pipelines, database design
- **Authority:** Design pipelines, migrations
- **Workflow:** `.agent/workflows/data-engineer.md`

### 🎨 UX Design Expert
- **Command:** `/ux-design-expert`
- **Role:** User experience, UI/UX, design
- **Authority:** Design decisions, usability guidance
- **Workflow:** `.agent/workflows/ux-design-expert.md`

### 👥 Squad Creator
- **Command:** `/squad-creator`
- **Role:** Team organization, squad composition
- **Authority:** Organize squads, define composition
- **Workflow:** `.agent/workflows/squad-creator.md`

---

## Authority Matrix (Non-Negotiable)

| Authority | Exclusive Agent |
|-----------|-----------------|
| git push to remote | @devops |
| Create Pull Requests | @devops |
| Create releases/tags | @devops |
| Create stories | @sm, @po |
| Architecture decisions | @architect |
| Quality verdicts | @qa |

⚠️ These authorities cannot be assumed by other agents

---

## Configuration

- **Settings:** `.claude/settings.json`
- **Registry:** `.claude/slash-commands.json`
- **Workflows:** `.agent/workflows/*.md`
- **Commands:** `.agent/commands/` (documentation)

---

## See Also

- [CLAUDE.md](../.claude/CLAUDE.md) — Project development rules
- [Constitution](../constitution.md) — Non-negotiable principles
- Agent persona files — `.aios-core/development/agents/`

---

*Synkra AIOS Framework · Agent Command System*
