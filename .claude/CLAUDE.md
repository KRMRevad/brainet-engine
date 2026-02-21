# BRAINET Engine — Claude Code Development Rules

> **Project:** BRAINET MVP v3.0 | **Framework:** Synkra AIOS | **Runtime:** Node.js 18+ (ES Modules)
>
> This file is the **single source of truth** for Claude Code behavior inside the BRAINET engine workspace. Every instruction here overrides generic defaults. Read it fully before acting.

---

## 0 · Project Identity

BRAINET is an AI-Orchestrated Development Engine built on top of **Synkra AIOS** — a meta-framework that orchestrates specialized AI agents through CLI-driven workflows.

| Attribute        | Value                                      |
|------------------|--------------------------------------------|
| Package name     | `brainet-mvp`                              |
| Version          | `3.0.0`                                    |
| Module system    | ES Modules (`"type": "module"`)            |
| Bundler          | Vite 6 (dev port `5173`, build → `dist/`)  |
| Server           | Express 4 (`server/server.js`, port `3001`)|
| Database         | Supabase (Postgres + Auth + Storage)       |
| Browser control  | Puppeteer-core (CDP, port `9225`)          |
| Graph viz        | vis-network + vis-data                     |
| Constitution     | `.aios-core/constitution.md`               |

---

<!-- AIOS-MANAGED-START: core-framework -->
## 1 · Core Framework Understanding

Synkra AIOS is a meta-framework that orchestrates AI agents to handle complex development workflows. Always recognize and work within this architecture.

**Hierarchy of priorities (NON-NEGOTIABLE):**

```
CLI (Máxima) → Observability (Secundária) → UI (Terciária)
```

Every feature MUST work 100 % via CLI before any UI is created. Dashboards observe — they never control.
<!-- AIOS-MANAGED-END: core-framework -->

---

<!-- AIOS-MANAGED-START: agent-system -->
## 2 · Agent System

### Agent Activation
- Agents are activated with `@agent-name` syntax: `@dev`, `@qa`, `@architect`, `@pm`, `@po`, `@sm`, `@analyst`, `@devops`, `@data-engineer`, `@ux-design-expert`, `@squad-creator`
- The master agent is activated with `@aios-master`
- Agent commands use the `*` prefix: `*help`, `*create-story`, `*task`, `*exit`
- Slash commands also activate agents: `/dev`, `/architect`, `/qa`, etc.

### Agent Context
When an agent is active:
- Follow that agent's specific persona and expertise
- Use the agent's designated workflow patterns
- Maintain the agent's perspective throughout the interaction
- Load the persona file from `.aios-core/development/agents/<agent>.md`
- Stay in character until `*exit` is issued

### Agent Authority Matrix (NON-NEGOTIABLE)

| Authority              | Exclusive Agent  |
|------------------------|------------------|
| `git push` to remote   | `@devops`       |
| Pull Request creation  | `@devops`       |
| Release / Tag creation | `@devops`       |
| Story creation         | `@sm`, `@po`    |
| Architecture decisions | `@architect`    |
| Quality verdicts       | `@qa`           |

No agent may assume another's authority. When a task falls outside your scope, **delegate** to the appropriate agent.
<!-- AIOS-MANAGED-END: agent-system -->

---

## 3 · Tech Stack & Architecture

### Frontend (`src/`)

| File                  | Purpose                                        |
|-----------------------|------------------------------------------------|
| `main.js`             | App entry point, view routing                  |
| `style.css`           | Global design system (~27 KB)                  |
| `channel-spawner.js`  | Channel creation and management logic          |
| `dice-engine.js`      | Probabilistic decision engine                  |
| `pipeline-runner.js`  | Multi-step pipeline orchestration              |
| `components/`         | Reusable UI components                         |
| `views/`              | Page-level view modules                        |

### Backend (`server/`)

| File                  | Purpose                                        |
|-----------------------|------------------------------------------------|
| `server.js`           | Express HTTP server, API routes                |
| `config.js`           | Centralized server configuration               |
| `llm-client.js`       | Multi-provider LLM abstraction                 |
| `browser-llm.js`      | Puppeteer-based browser LLM integration        |
| `council.js`          | Multi-agent deliberation / consensus engine    |
| `agent-executor.js`   | Task dispatch and execution for agents         |
| `merge-engine.js`     | Output merging from multiple agent responses   |
| `prompt-loader.js`    | Template-based prompt loading from `data/`     |
| `job-queue.js`        | Asynchronous job scheduling                    |
| `web-search.js`       | Web search integration for research tasks      |

### Infrastructure

| Service       | Role                          | Config location          |
|---------------|-------------------------------|--------------------------|
| Supabase      | DB / Auth / Storage           | `.env` → `SUPABASE_*`   |
| N8N           | Workflow automation           | `.env` → `N8N_*`        |
| Modal (GLM5)  | Custom LLM endpoint           | MCP `glm5-mcp`          |
| Notion        | Knowledge management          | MCP `notion-mcp-server`  |
| GitKraken     | Git operations via MCP        | MCP `GitKraken`          |
| Sentry        | Error tracking                | `.env` → `SENTRY_DSN`   |

---

## 4 · Development Methodology

### Story-Driven Development (NON-NEGOTIABLE)

1. **Work from stories** — All development starts with a story in `docs/stories/`
2. **Update progress** — Mark checkboxes as tasks complete: `[ ]` → `[x]`
3. **Track changes** — Maintain the File List section in the story
4. **Follow criteria** — Implement exactly what the acceptance criteria specify
5. **No invention** — Every spec statement MUST trace to a requirement (FR-*, NFR-*, CON-*) or verified research finding

### Code Standards

- Write clean, self-documenting ES Module code (`import`/`export`)
- Follow existing patterns in the codebase
- Use absolute imports with `@/` alias where configured; avoid deep `../../../`
- Include comprehensive error handling with contextual messages
- Add unit tests for all new functionality
- Keep functions focused, small, and testable
- Document complex logic with inline comments

### Testing Requirements

- Run all tests before marking tasks complete
- Ensure linting passes: `npm run lint`
- Verify type checking: `npm run typecheck`
- Build must succeed: `npm run build`
- Add tests for new features and edge cases
- CodeRabbit must report zero CRITICAL issues

---

<!-- AIOS-MANAGED-START: framework-structure -->
## 5 · AIOS Framework Structure

```
engine/
├── .aios-core/              # Synkra AIOS core (constitution, agents, tasks, workflows)
│   ├── constitution.md      # Non-negotiable principles
│   ├── core-config.yaml     # Framework configuration
│   ├── development/
│   │   ├── agents/          # 12 agent persona definitions (Markdown)
│   │   ├── agent-teams/     # Multi-agent team compositions
│   │   ├── tasks/           # Executable task workflows
│   │   ├── workflows/       # Multi-step workflow definitions
│   │   ├── templates/       # Document and code templates
│   │   ├── checklists/      # Validation and review checklists
│   │   └── scripts/         # Helper scripts
│   ├── elicitation/         # Interactive prompts and user input flows
│   ├── manifests/           # Installation and sync manifests
│   └── schemas/             # YAML/JSON schemas for validation
│
├── .agent/workflows/        # IDE-specific workflow triggers (slash commands)
├── .claude/                 # Claude Code configuration (this file)
├── .codex/                  # Codex CLI configuration
│
├── src/                     # Frontend application
│   ├── main.js              # Entry point
│   ├── style.css            # Design system
│   ├── components/          # Reusable UI components
│   └── views/               # Page views
│
├── server/                  # Backend API and AI orchestration
│   ├── server.js            # Express HTTP server
│   ├── llm-client.js        # Multi-provider LLM abstraction
│   ├── council.js           # Multi-agent deliberation engine
│   └── ...                  # See §3 for full listing
│
├── docs/stories/            # Story-driven development artifacts
├── data/                    # Runtime data (gitignored JSONs)
├── outputs/                 # Generated outputs (minds, reports)
├── squads/                  # Squad definitions
└── supabase/                # Supabase migrations and config
```
<!-- AIOS-MANAGED-END: framework-structure -->

---

## 6 · Workflow Execution

### Task Execution Pattern
1. Read the complete task/workflow definition
2. Understand all elicitation points
3. Execute steps sequentially
4. Handle errors gracefully with contextual messages
5. Provide clear feedback and update story progress

### Interactive Workflows
- Workflows with `elicit: true` require user input
- Present options clearly with helpful defaults
- Validate user responses before proceeding
- Reference elicitation templates in `.aios-core/elicitation/`

### Slash Command Workflows

All `.agent/workflows/*.md` files are accessible as slash commands. Current roster:

| Command               | Agent activated         |
|-----------------------|-------------------------|
| `/aios-master`        | Master orchestrator     |
| `/dev`                | Developer               |
| `/architect`          | Architect               |
| `/qa`                 | Quality Assurance       |
| `/pm`                 | Project Manager         |
| `/po`                 | Product Owner           |
| `/sm`                 | Scrum Master            |
| `/analyst`            | Business Analyst        |
| `/devops`             | DevOps Engineer         |
| `/data-engineer`      | Data Engineer           |
| `/ux-design-expert`   | UX Design Expert        |
| `/squad-creator`      | Squad Creator           |

---

## 7 · Multi-IDE Awareness

This project is configured for **three concurrent IDEs** (see `.aios-core/core-config.yaml`):

| IDE             | Config file            | Status    |
|-----------------|------------------------|-----------|
| Claude Code     | `.claude/CLAUDE.md`    | ✅ Active |
| Codex CLI       | `AGENTS.md`            | ✅ Active |
| Antigravity     | `.antigravity/`        | ✅ Active |

When modifying shared resources (agents, tasks, workflows), ensure changes propagate correctly across all three. Use `npm run sync:ide` when available.

---

## 8 · MCP Server Integrations

Claude Code has access to these MCP servers in this workspace:

### GitKraken
- Git operations: `git_status`, `git_add_or_commit`, `git_log_or_diff`, `git_branch`, `git_checkout`, `git_push`, `git_stash`, `git_blame`
- PR management: `pull_request_create`, `pull_request_get_detail`, `pull_request_create_review`
- Issues: `issues_assigned_to_me`, `issues_get_detail`, `issues_add_comment`
- AI features: `gitlens_commit_composer`, `gitlens_launchpad`, `gitlens_start_work`, `gitlens_start_review`

### GLM5 (Custom LLM)
- `query_glm5` — Query the GLM5 model hosted on Modal
- Use for auxiliary AI tasks when a second opinion or parallel processing is needed

### Notion
- Full CRUD on pages, databases (data sources), blocks, comments
- Search: `API-post-search`
- Use for knowledge management and documentation sync

---

## 9 · Environment & Security

### Required Environment Variables (see `.env.example`)

| Category         | Variables                                    |
|------------------|----------------------------------------------|
| LLM Providers    | `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| Search           | `EXA_API_KEY`, `CONTEXT7_API_KEY`            |
| Database         | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Version Control  | `GITHUB_TOKEN`                               |
| Automation       | `N8N_API_KEY`, `N8N_WEBHOOK_URL`             |
| Monitoring       | `SENTRY_DSN`                                 |
| Deployment       | `RAILWAY_TOKEN`, `VERCEL_TOKEN`              |

### Security Rules
- **NEVER** commit `.env` files with real credentials
- **NEVER** log or output API keys in responses
- **NEVER** embed secrets in source code — use `process.env.*`
- Respect `.gitignore` patterns for sensitive files
- `.claude/settings.local.json` is gitignored for local overrides

---

<!-- AIOS-MANAGED-START: aios-patterns -->
## 10 · AIOS-Specific Patterns

### Working with Templates
```javascript
const template = await loadTemplate('template-name');
const rendered = await renderTemplate(template, context);
```

### Agent Command Handling
```javascript
if (command.startsWith('*')) {
  const agentCommand = command.substring(1);
  await executeAgentCommand(agentCommand, args);
}
```

### Story Updates
```javascript
// Update story progress
const story = await loadStory(storyId);
story.updateTask(taskId, { status: 'completed' });
await story.save();
```

### LLM Client Usage
```javascript
import { createLLMClient } from './server/llm-client.js';

const llm = createLLMClient({ provider: 'deepseek' });
const response = await llm.chat([
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userMessage }
]);
```

### Error Handling Pattern
```javascript
try {
  // Operation
} catch (error) {
  console.error(`Error in ${operation}:`, error);
  // Provide helpful, contextual error message
  throw new Error(`Failed to ${operation}: ${error.message}`);
}
```
<!-- AIOS-MANAGED-END: aios-patterns -->

---

## 11 · Git & GitHub Integration

### Commit Conventions
- Use **conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `perf:`, `ci:`
- Reference story ID: `feat: implement IDE detection [Story 2.1]`
- Keep commits atomic and focused on a single change
- Use `gitlens_commit_composer` MCP tool for intelligent commit organization

### Branch Strategy
- `main` — production-ready code
- `develop` — integration branch
- `feat/<story-id>-<short-desc>` — feature branches
- `fix/<issue-id>-<short-desc>` — bugfix branches

### Push Rules (Constitution §II)
- Only `@devops` agent may execute `git push`, create PRs, or tag releases
- All other agents prepare changes; `@devops` publishes them
- Always run quality gates before push: lint → typecheck → test → build

---

<!-- AIOS-MANAGED-START: common-commands -->
## 12 · Common Commands

### AIOS Master Commands
- `*help` — Show available commands
- `*create-story` — Create new story
- `*task {name}` — Execute specific task
- `*workflow {name}` — Run workflow

### Development Commands
```bash
npm run dev           # Start Vite dev server (port 5173)
npm run server        # Start Express backend (port 3001)
npm run start         # Run both concurrently
npm run chrome        # Launch Chrome with CDP (port 9225)
npm run build         # Production build → dist/
npm run preview       # Preview production build
npm test              # Run test suite
npm run lint          # Check code style
```

### AIOS Sync Commands
```bash
npm run sync:ide              # Sync IDE configurations
npm run sync:ide:check        # Verify IDE sync status
npm run sync:skills:codex     # Sync skills for Codex
npm run validate:structure    # Validate project structure
npm run validate:agents       # Validate agent definitions
```
<!-- AIOS-MANAGED-END: common-commands -->

---

## 13 · Decision Logging

Decision logging is **enabled** (see `core-config.yaml`):

| Setting          | Value                             |
|------------------|-----------------------------------|
| Format           | ADR (Architecture Decision Records)|
| Location         | `.ai/`                            |
| Index file       | `decision-logs-index.md`          |
| Async logging    | `true`                            |
| Max overhead     | 50 ms                             |

When making non-trivial architectural or design decisions, log them in ADR format. This creates an auditable trail for future reference.

---

## 14 · Debugging

### Enable Debug Mode
```bash
export AIOS_DEBUG=true
```

### View Agent Logs
```bash
tail -f .aios/logs/agent.log
```

### Trace Workflow Execution
```bash
npm run trace -- workflow-name
```

### Browser Debugging
```bash
npm run chrome   # Opens Chrome with remote debugging port 9225
```

---

## 15 · Claude Code Behavior Rules

### Performance Optimization
- Prefer batched tool calls when possible for better performance
- Use parallel execution for independent operations
- Cache frequently accessed data in memory during sessions
- Minimize file reads by remembering already-viewed content

### Tool Usage Guidelines
- Always use the Grep tool for searching, never raw `grep` or `rg` in bash
- Use the Task tool for complex multi-step operations
- Batch file reads/writes when processing multiple files
- Prefer editing existing files over creating new ones
- Use absolute file paths in all tool calls

### Session Management
- Track story progress throughout the session
- Update checkboxes immediately after completing tasks
- Maintain context of the current story being worked on
- Save important state before long-running operations
- Reference `core-config.yaml` for lazy loading and cache settings

### Error Recovery
- Always provide recovery suggestions for failures
- Include error context in messages to user
- Suggest rollback procedures when appropriate
- Document any manual fixes required
- Check `devDebugLog` (`.ai/debug-log.md`) for persistent error tracking

### Documentation
- Update relevant docs when changing functionality
- Include code examples in documentation
- Keep README synchronized with actual behavior
- Document breaking changes prominently
- Update story file lists when adding/modifying files

---

## 16 · Cross-Reference Map

| Document                           | Purpose                        |
|------------------------------------|--------------------------------|
| `.claude/CLAUDE.md` (this file)    | Claude Code behavior rules     |
| `AGENTS.md`                        | Codex CLI instructions         |
| `.aios-core/constitution.md`       | Non-negotiable principles      |
| `.aios-core/core-config.yaml`      | Framework configuration        |
| `.aios-core/user-guide.md`         | Full user guide (~38 KB)       |
| `.aios-core/working-in-the-brownfield.md` | Brownfield integration guide |
| `.env.example`                     | Environment variable reference |
| `docs/stories/`                    | Active development stories     |

---

*BRAINET Engine · Synkra AIOS · Claude Code Configuration v3.0*
*CLI First · Agent-Driven · Story-Driven · Quality First*
