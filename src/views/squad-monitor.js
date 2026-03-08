/**
 * Squad Monitor View — Central Command for the Agile Factory
 */

import { navigateTo } from '../main.js'
import { GlassCard, Badge } from '../components/ui.js'
import { escapeHtml } from '../utils.js'

// Mock Data for the Agile Squad Agents
const MOCK_SQUAD = [
    {
        role: 'Product Manager (PM)',
        agentName: 'Lumina',
        status: 'working',
        currentTask: 'Refining Epics for V3 Architecture',
        uptime: '14h 23m',
        lastAction: 'Updated Jira Ticket #402',
        color: 'emerald'
    },
    {
        role: 'System Architect',
        agentName: 'Nexus',
        status: 'validating',
        currentTask: 'Verifying Distributed Consensus',
        uptime: '2d 4h',
        lastAction: 'Approved Schema Migration',
        color: 'blue'
    },
    {
        role: 'Scrum Master (SM)',
        agentName: 'Aegis',
        status: 'working',
        currentTask: 'Unblocking QA Environment Sync',
        uptime: '5h 12m',
        lastAction: 'Triggered Slack Alert to DevOps',
        color: 'fuchsia'
    },
    {
        role: 'Quality Assurance (QA)',
        agentName: 'Specter',
        status: 'idle',
        currentTask: 'Awaiting Pipeline Build',
        uptime: '45m',
        lastAction: 'Finished E2E Test Suite (100% Pass)',
        color: 'amber'
    }
]

function getStatusIndicator(status) {
    switch (status) {
        case 'working':
            return `<div class="w-3 h-3 rounded-full animate-pulse bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]"></div>`;
        case 'validating':
            return `<div class="w-3 h-3 rounded-full animate-pulse bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>`;
        case 'idle':
        default:
            return `<div class="w-3 h-3 rounded-full bg-slate-500"></div>`;
    }
}

export async function renderSquadMonitor(container, data = {}) {
    // Clean container
    container.innerHTML = ''
    container.className = 'view w-full min-h-[calc(100vh-4rem)] bg-[#06060e] p-6 sm:p-8 text-slate-200 font-sans'

    // Header
    const header = document.createElement('div')
    header.className = 'max-w-7xl mx-auto mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'
    header.innerHTML = `
    <div>
      <h1 class="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 uppercase tracking-tight">
        Central de Comando
      </h1>
      <p class="text-slate-400 mt-2 text-sm max-w-2xl">
        Monitoramento ao vivo da Fábrica Ágil. Todos os agentes operando sob a diretriz Mosaico EVAD.
      </p>
    </div>
    <div class="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
      <div class="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"></div>
      <span class="text-xs font-mono text-emerald-400">STATUS: OPERACIONAL</span>
    </div>
  `
    container.appendChild(header)

    // Grid Container
    const grid = document.createElement('div')
    grid.className = 'max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'

    // Render Agent Cards
    MOCK_SQUAD.forEach(agent => {
        // Determine gradient based on color string
        let bgGradient = 'from-slate-800 to-slate-900'
        let textAccent = 'text-slate-400'
        let borderAccent = 'border-slate-700'

        if (agent.color === 'emerald') {
            textAccent = 'text-emerald-400'
            borderAccent = 'border-emerald-500/30'
        } else if (agent.color === 'blue') {
            textAccent = 'text-blue-400'
            borderAccent = 'border-blue-500/30'
        } else if (agent.color === 'fuchsia') {
            textAccent = 'text-fuchsia-400'
            borderAccent = 'border-fuchsia-500/30'
        } else if (agent.color === 'amber') {
            textAccent = 'text-amber-400'
            borderAccent = 'border-amber-500/30'
        }

        const cardContent = `
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="font-mono text-xs text-slate-400 uppercase tracking-widest mb-1">${escapeHtml(agent.role)}</h3>
          <h2 class="text-xl font-bold text-white">${escapeHtml(agent.agentName)}</h2>
        </div>
        <div class="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/5">
          ${getStatusIndicator(agent.status)}
          <span class="text-[10px] font-mono uppercase text-slate-300">${escapeHtml(agent.status)}</span>
        </div>
      </div>
      
      <div class="space-y-4 mt-6">
        <div>
          <span class="block text-[10px] font-mono text-slate-500 mb-1">CURRENT TASK</span>
          <p class="text-sm text-slate-200 line-clamp-2">${escapeHtml(agent.currentTask)}</p>
        </div>
        
        <div class="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
          <div>
            <span class="block text-[10px] font-mono text-slate-500 mb-1">UPTIME</span>
            <span class="text-xs font-medium text-slate-300">${escapeHtml(agent.uptime)}</span>
          </div>
          <div>
            <span class="block text-[10px] font-mono text-slate-500 mb-1">LAST ACTION</span>
            <span class="text-xs font-medium ${textAccent} block truncate" title="${escapeHtml(agent.lastAction)}">
              ${escapeHtml(agent.lastAction)}
            </span>
          </div>
        </div>
      </div>
    `

        // Wrapper to apply custom border accent if needed by wrapping GlassCard contents
        // But GlassCard already provides a standard glass look. We will inject our HTML into it.
        const cardEl = document.createElement('div')
        // We add a subtle top border highlight
        cardEl.className = 'relative group transition-all duration-300 hover:-translate-y-1'

        // Create the highlight bar
        const highlight = document.createElement('div')
        highlight.className = `absolute top-0 left-0 right-0 h-[2px] rounded-t-xl bg-gradient-to-r ${textAccent.replace('text-', 'from-')} to-transparent opacity-50`

        const glass = GlassCard({
            content: cardContent,
            className: `h-full border-t-0 rounded-t-none rounded-b-xl ${borderAccent}`
        })

        cardEl.appendChild(highlight)
        cardEl.appendChild(glass)
        grid.appendChild(cardEl)
    })

    container.appendChild(grid)

    // Quick Actions Footer
    const footer = document.createElement('div')
    footer.className = 'max-w-7xl mx-auto mt-10 p-4 border border-white/10 bg-white/5 rounded-xl flex flex-wrap gap-4 items-center justify-between'
    footer.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-xl">⚡</span>
      <div>
        <h4 class="text-sm font-bold text-slate-200">System Directives</h4>
        <p class="text-xs text-slate-400">Override or sync cross-squad protocols</p>
      </div>
    </div>
    <div class="flex gap-3">
      <button class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded transition-colors border border-slate-700">SYNC LOGS</button>
      <button class="px-4 py-2 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-mono rounded transition-colors border border-violet-500/30">DEFER TO PM</button>
    </div>
  `
    container.appendChild(footer)

    // Make the container visible
    // Note: The router already adds 'active' class, but we need to ensure our layout doesn't break
    // wait a tick for transitions
    requestAnimationFrame(() => {
        container.classList.add('active')
    })
}
