# Synkra AIOS Project Commands

This project uses the Synkra AIOS framework. The agents are located in \`.aios-core/development/agents/\`. 

To activate an agent, read its corresponding markdown file. For example, to activate the Architect, read \`.aios-core/development/agents/architect.md\` and follow its activation instructions.

Available Agents:
- \`aios-master.md\` (Master Orchestrator)
- \`analyst.md\` (Analyst)
- \`architect.md\` (Architect)
- \`data-engineer.md\` (Data Engineer)
- \`dev.md\` (Developer)
- \`devops.md\` (DevOps)
- \`pm.md\` (Product Manager)
- \`po.md\` (Product Owner)
- \`qa.md\` (QA)
- \`sm.md\` (Scrum Master)
- \`squad-creator.md\` (Squad Creator)
- \`ux-design-expert.md\` (UX Design Expert)

Commands:
- You can find specific agent activation scripts and commands inside the \`.claude/commands/\` directory.
# Instruções para IA (Claude Code)

### NEVER

- Implement without showing options first (always 1, 2, 3 format)
- Delete/remove content without asking first
- Delete anything created in the last 7 days without explicit approval
- Change something that was already working
- Pretend work is done when it isn't
- Process batch without validating one first
- Add features that weren't requested
- Use mock data when real data exists in database
- Explain/justify when receiving criticism (just fix)
- Trust AI/subagent output without verification
- Create from scratch when similar exists in squads/

### ALWAYS

- Present options as "1. X, 2. Y, 3. Z" format
- Use AskUserQuestion tool for clarifications
- Check squads/ and existing components before creating new
- Read COMPLETE schema before proposing database changes
- Investigate root cause when error persists
- Commit before moving to next task
- Create handoff in `docs/sessions/YYYY-MM/` at end of session
