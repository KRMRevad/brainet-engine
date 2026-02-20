/**
 * Jobs View — History of pipeline executions
 */

import { navigateTo } from '../main.js'

const API_BASE = 'http://localhost:3001'

export async function renderJobs(container) {
    container.innerHTML = `
    <div class="stats-view">
      <h1>📋 Pipeline Jobs</h1>
      <div id="jobs-list" style="margin-top: var(--space-lg);">
        <p style="color: var(--text-muted);">Carregando...</p>
      </div>
    </div>
  `

    try {
        const res = await fetch(`${API_BASE}/api/jobs`)
        const data = await res.json()
        renderJobsList(container, data.jobs)
    } catch {
        container.querySelector('#jobs-list').innerHTML = `
      <div style="text-align: center; padding: var(--space-xl); color: var(--text-muted);">
        <p>Backend offline. Execute: <code>npm run server</code></p>
        <p style="margin-top: var(--space-sm);">Os jobs são armazenados no servidor backend.</p>
      </div>
    `
    }
}

function renderJobsList(container, jobs) {
    const listEl = container.querySelector('#jobs-list')

    if (!jobs || jobs.length === 0) {
        listEl.innerHTML = `
      <div style="text-align: center; padding: var(--space-xl); color: var(--text-muted);">
        <p>Nenhum job executado ainda.</p>
        <p>Use o 🎲 dado para sortear um nicho e execute o pipeline real.</p>
      </div>
    `
        return
    }

    listEl.innerHTML = jobs.map(job => {
        const statusIcon = {
            'queued': '⏳',
            'running': '🔄',
            'complete': '✅',
            'error': '❌',
        }[job.status] || '❓'

        const agentCount = Object.keys(job.agents || {}).length
        const completeAgents = Object.values(job.agents || {}).filter(a => a.status === 'complete').length

        return `
      <div class="exploration-item" style="cursor: pointer; margin-bottom: var(--space-sm);" data-job="${job.id}">
        <div class="exp-info">
          <span class="exp-emoji">${statusIcon}</span>
          <div>
            <div class="exp-name">${job.input.angulo}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              ${job.input.nichoNome} · ${completeAgents}/${agentCount} agentes · ${job.duration || 'em progresso'}
            </div>
          </div>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-muted);">
          ${new Date(job.createdAt).toLocaleString('pt-BR')}
          ${job.errors > 0 ? `<span style="color: var(--niche-financas);">⚠️ ${job.errors} erros</span>` : ''}
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
    <button class="back-btn" id="jobs-back">← Voltar para lista</button>

    <div style="margin-top: var(--space-lg);">
      <h2 style="color: var(--text-accent); font-size: 1.1rem;">${job.input.angulo}</h2>
      <p style="color: var(--text-muted); margin-bottom: var(--space-lg);">
        ${job.input.nichoNome} · ${job.status} · ${job.duration || '...'}
      </p>

      ${Object.entries(outputs).map(([agentId, output]) => {
        const agentInfo = job.agents[agentId] || {}
        return `
          <details style="margin-bottom: var(--space-md);">
            <summary style="cursor: pointer; color: var(--text-accent); padding: var(--space-sm); background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              ${agentInfo.status === 'complete' ? '✅' : '❌'} Agente ${agentId} — ${(output.length / 1024).toFixed(1)} KB
            </summary>
            <pre style="white-space: pre-wrap; font-size: 0.75rem; max-height: 500px; overflow-y: auto; padding: var(--space-md); background: var(--bg-primary); border: 1px solid var(--border-subtle); border-radius: 0 0 var(--radius-md) var(--radius-md); margin-top: -1px;">
${escapeHtml(output.substring(0, 5000))}${output.length > 5000 ? '\n\n... [ver completo no workspace]' : ''}</pre>
          </details>
        `
    }).join('')}
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

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
