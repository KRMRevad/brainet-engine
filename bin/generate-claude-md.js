const fs = require('fs');
const path = require('path');

const agentsDir = path.join(process.cwd(), '.aios-core', 'development', 'agents');
const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));

let claudeMd = `# Synkra AIOS Project Commands

This file defines the intelligent agents available in this workspace.

`;

agents.forEach(agentFile => {
    const name = agentFile.replace('.md', '');
    claudeMd += `## Agent: ${name}\n`;
    claudeMd += `You can assume this agent's persona. To activate it, read: \`.aios-core/development/agents/${agentFile}\`\n\n`;
});

fs.writeFileSync(path.join(process.cwd(), 'CLAUDE.md'), claudeMd);
console.log('CLAUDE.md created successfully.');
