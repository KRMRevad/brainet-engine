/**
 * Jobs View — History of pipeline executions
 */

import { navigateTo } from '../main.js'
import { API_BASE } from '../config.js'
import { escapeHtml } from '../utils.js'
import { GlassCard, Badge } from '../components/ui.js'

export async function renderJobs(container) {
  container.innerHTML = `
    <div class="px-6 py-6 max-w-4xl mx-auto sm:px-4 sm:py-4">
      <h1 class="text-3xl font-black mb-8 text-white flex items-center gap-3">
        <span>📋</span>
        Pipeline Jobs
      </h1>
      <div id="jobs-list" class="flex flex-col gap-4">
        <div class="text-center p-8 text-gray-500 font-mono animate-pulse">Carregando...</div>
      </div>
    </div>
  `

  try {
    const res = await fetch(`${API_BASE}/api/jobs`)
    const data = await res.json()
    renderJobsList(container, data.jobs)
  } catch {
    container.querySelector('#jobs-list').innerHTML = `
      <div class="text-center p-12 sm:p-6 bg-white/5 border border-red-500/30 rounded-2xl text-gray-400">
        <p class="mb-4">Backend offline. Execute: <code class="bg-red-500/10 text-red-400 px-2 py-1 rounded">npm run server</code></p>
        <p class="text-sm">Os jobs são armazenados no servidor backend.</p>
      </div>
    `
  }
}

function renderJobsList(container, jobs) {
  const listEl = container.querySelector('#jobs-list')

  if (!jobs || jobs.length === 0) {
    listEl.innerHTML = `
      <div class="text-center p-12 sm:p-6 bg-white/5 border border-white/10 rounded-2xl text-gray-400">
        <p class="mb-2 text-lg text-white">Nenhum job executado ainda.</p>
        <p class="text-sm">Use o 🎲 dado para sortear um nicho e execute o pipeline real.</p>
      </div>
    `
    return
  }

  listEl.innerHTML = jobs.map((job, i) => {
    const statusIcon = {
      'queued': '⏳',
      'running': '🔄',
      'complete': '✅',
      'error': '❌',
    }[job.status] || '❓'

    const agentCount = Object.keys(job.agents || {}).length
    const completeAgents = Object.values(job.agents || {}).filter(a => a.status === 'complete').length

    return `
      <div class="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-violet-500/50 hover:bg-white/10 transition-all duration-300 cursor-pointer group animate-[fade-up_0.5s_ease-out_both]" style="animation-delay: ${i * 50}ms" data-job="${job.id}">
        <div class="flex flex-wrap items-start justify-between gap-4 sm:flex-col sm:gap-2">
          
          <div class="flex items-center gap-4 flex-1 min-w-[200px]">
            <div class="w-12 h-12 rounded-lg bg-[#0f0f1e] border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              ${statusIcon}
            </div>
            <div>
              <div class="font-bold text-white text-lg mb-1 leading-tight line-clamp-2">${job.input.angulo}</div>
              <div class="text-xs text-gray-400 font-mono flex items-center gap-2 flex-wrap">
                <span class="text-violet-400 font-semibold">${job.input.nichoNome}</span>
                <span>•</span>
                <span>${completeAgents}/${agentCount} agentes</span>
                <span>•</span>
                <span>${job.duration || 'em progresso'}</span>
              </div>
            </div>
          </div>
          
          <div class="text-right sm:text-left text-xs font-mono text-gray-500 flex flex-col gap-2">
            <div>${new Date(job.createdAt).toLocaleString('pt-BR')}</div>
            ${job.errors > 0 ? Badge({ text: `${job.errors} erros`, color: 'red', icon: '⚠️' }) : ''}
          </div>

        </div>
      </div>
    `
  }).join('')

  // Click to expand
  listEl.querySelectorAll('[data-job]').forEach(el => {
    el.addEventListener('click', async () => {
      const jobId = el.dataset.job
      try {
        const res = await fetch(`${API_BASE}/api/pipeline/output/${jobId}`)
        const job = await res.json()
        showJobDetail(container, job)
      } catch {
        // Fallback
      }
    })
  })
}

function showJobDetail(container, job) {
  const listEl = container.querySelector('#jobs-list')
  const outputs = job.outputs || {}

  listEl.innerHTML = `
    <button class="text-sm text-gray-400 hover:text-white mb-6 transition-colors flex items-center gap-2" id="jobs-back">
      <span>←</span> Voltar para lista
    </button>

    <div class="mb-8">
      <h2 class="text-2xl font-bold text-violet-400 mb-2 leading-tight">${job.input.angulo}</h2>
      <div class="flex items-center gap-3 text-sm text-gray-400 font-mono mb-8">
        <span class="text-white">${job.input.nichoNome}</span>
        <span>•</span>
        ${Badge({ text: job.status, color: job.status === 'complete' ? 'emerald' : 'orange' })}
        <span>•</span>
        <span>${job.duration || '...'}</span>
      </div>

      <div class="flex flex-col gap-4">
        ${Object.entries(outputs).map(([agentId, output]) => {
    const agentInfo = job.agents[agentId] || {}
    return `
            <details class="bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
              <summary class="cursor-pointer p-4 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-3 select-none">
                <span class="text-lg">${agentInfo.status === 'complete' ? '✅' : '❌'}</span>
                <span class="font-bold text-white">Agente ${agentId}</span>
                <span class="text-gray-500 text-xs font-mono ml-auto">${(output.length / 1024).toFixed(1)} KB</span>
                <span class="text-gray-500 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div class="p-4 bg-black/40 border-t border-white/10 max-h-[500px] overflow-y-auto">
                <pre class="font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">${escapeHtml(output.substring(0, 5000))}${output.length > 5000 ? '\n\n... [ver completo no workspace]' : ''}</pre>
              </div>
            </details>
          `
  }).join('')}
      </div>
    </div>
  `

  container.querySelector('#jobs-back').addEventListener('click', async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs`)
      const data = await res.json()
      listEl.innerHTML = ''
      renderJobsList(container, data.jobs)
    } catch { }
  })
}
