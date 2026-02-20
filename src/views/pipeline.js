/**
 * Pipeline View V3 — AI Council with SOLO/COUNCIL/CASCADE modes
 * Falls back to mock pipeline if backend is not running
 */

import { runPipeline as runMockPipeline } from '../pipeline-runner.js'
import { navigateTo } from '../main.js'

const API_BASE = 'http://localhost:3001'

export function renderPipeline(container, data = {}) {
  if (!data.nicho || !data.angulo) {
    navigateTo('landing')
    return
  }

  container.innerHTML = `
    <div class="pipeline">
      <button class="back-btn" id="back-btn">← Voltar</button>

      <div class="pipeline-header">
        <div class="color-bar" style="background: linear-gradient(90deg, ${data.nicho.cor}, ${data.nicho.corSecundaria}); max-width: 200px; margin: 0 auto var(--space-md);"></div>
        <h1>⚡ Pipeline de Produção</h1>
        <p style="color: var(--text-secondary);">${data.nicho.emoji} ${data.nicho.nome} · ${data.formato?.icone || '📹'} ${data.formato?.nome || 'Todos'}</p>
        <div class="pipeline-angle">"${data.angulo}"</div>
      </div>

      <!-- Council Mode Selector -->
      <div class="council-selector" id="council-selector">
        <span class="council-label">🧠 Modo do Conselho:</span>
        <div class="council-modes">
          <button class="council-mode-btn active" data-mode="solo" title="1 IA responde">
            <span class="mode-icon">🎯</span>
            <span class="mode-name">SOLO</span>
          </button>
          <button class="council-mode-btn" data-mode="council" title="3 IAs respondem & merge">
            <span class="mode-icon">👥</span>
            <span class="mode-name">COUNCIL</span>
          </button>
          <button class="council-mode-btn" data-mode="cascade" title="Cada IA refina a anterior">
            <span class="mode-icon">🔗</span>
            <span class="mode-name">CASCADE</span>
          </button>
        </div>
        <div class="council-ais" id="council-ais">
          <span class="ai-indicator" data-ai="chatgpt">💚 ChatGPT</span>
          <span class="ai-indicator" data-ai="claude">🟠 Claude</span>
          <span class="ai-indicator" data-ai="gemini">🔵 Gemini</span>
        </div>
      </div>

      <div class="pipeline-controls">
        <button class="btn btn-primary btn-glow" id="run-real-btn">
          🚀 Executar Pipeline
        </button>
        <button class="btn" id="run-mock-btn">
          📄 Preview (Mock)
        </button>
        <span id="pipeline-status" class="pipeline-status-text"></span>
      </div>

      <div class="pipeline-steps" id="pipeline-steps"></div>

      <div style="text-align: center; margin-top: var(--space-2xl);" id="pipeline-footer"></div>
    </div>
  `

  let selectedMode = 'solo'

  // Mode selector
  container.querySelectorAll('.council-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.council-mode-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      selectedMode = btn.dataset.mode
    })
  })

  // Check council health on load
  checkCouncilStatus(container)

  // Back
  container.querySelector('#back-btn').addEventListener('click', () => {
    navigateTo('niche-detail', { nicho: data.nicho })
  })

  // Mock pipeline
  container.querySelector('#run-mock-btn').addEventListener('click', () => {
    renderMockPipeline(data)
  })

  // Real pipeline
  container.querySelector('#run-real-btn').addEventListener('click', () => {
    startRealPipeline(data, selectedMode)
  })
}

/**
 * Check council health and update AI indicators
 */
async function checkCouncilStatus(container) {
  try {
    const health = await fetch(`${API_BASE}/api/health`).then(r => r.json())
    const council = health.council

    container.querySelectorAll('.ai-indicator').forEach(el => {
      const ai = el.dataset.ai
      const available = council?.ais?.[ai]?.available
      el.classList.toggle('available', available)
      el.classList.toggle('unavailable', !available)
    })

    if (!council?.connected) {
      document.getElementById('pipeline-status').innerHTML =
        `⚠️ Chrome não conectado. Execute: <code>npm run chrome</code>`
    }
  } catch {
    // Backend offline
  }
}

/**
 * Render mock pipeline (V1 behavior)
 */
function renderMockPipeline(data) {
  const result = runMockPipeline(data)
  const stepsEl = document.getElementById('pipeline-steps')

  stepsEl.innerHTML = result.pipeline.map((step, i) => renderMockStep(step, i)).join('')

  document.getElementById('pipeline-footer').innerHTML = `
    <button class="btn btn-primary" onclick="document.getElementById('run-real-btn').click()">
      🚀 Rodar com Conselho Real
    </button>
  `
}

function renderMockStep(step, index) {
  const delay = index * 100
  const output = { ...step }
  delete output.agentId; delete output.agentNome; delete output.agentEmoji
  delete output.agentDescricao; delete output.titulo; delete output.status

  return `
    <div class="pipeline-step" style="animation-delay: ${delay}ms">
      <div class="step-dot">${step.agentEmoji}</div>
      <div class="step-content">
        <div class="step-header">
          <span class="step-emoji">${step.agentEmoji}</span>
          <span class="step-name">${step.agentNome}</span>
          <span class="step-badge mock">MOCK</span>
        </div>
        <div class="step-output">${renderObj(output)}</div>
      </div>
    </div>
  `
}

/**
 * Start real pipeline via backend API + SSE with council mode
 */
async function startRealPipeline(data, councilMode) {
  const statusEl = document.getElementById('pipeline-status')
  const stepsEl = document.getElementById('pipeline-steps')
  const runBtn = document.getElementById('run-real-btn')

  statusEl.textContent = '🔄 Conectando ao backend...'
  runBtn.disabled = true

  // Check health
  try {
    const health = await fetch(`${API_BASE}/api/health`).then(r => r.json())
    const council = health.council

    if (councilMode !== 'solo' && !council?.connected) {
      statusEl.innerHTML = `⚠️ Chrome não conectado para modo ${councilMode.toUpperCase()}. Execute: <code>npm run chrome</code> e abra <code>chatgpt.com</code>, <code>claude.ai</code>, <code>gemini.google.com</code>`
      runBtn.disabled = false
      return
    }

    if (council?.connected) {
      const available = council.totalAvailable || 0
      statusEl.textContent = `✅ ${available} IAs disponíveis · Modo: ${councilMode.toUpperCase()}`
    } else if (health.llm?.ok) {
      statusEl.textContent = `✅ Fallback: ${health.llm.provider} (${health.llm.model || ''})`
    } else {
      statusEl.innerHTML = `❌ Nenhuma IA disponível. Abra Chrome com <code>npm run chrome</code> ou configure API key.`
      runBtn.disabled = false
      return
    }
  } catch (e) {
    statusEl.innerHTML = `❌ Backend offline. Execute: <code>npm run server</code>`
    runBtn.disabled = false
    return
  }

  // Start pipeline with council mode
  let jobId
  try {
    const res = await fetch(`${API_BASE}/api/pipeline/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nichoId: data.nicho.id,
        angulo: data.angulo,
        subtema: data.subtema?.id,
        formato: data.formato?.id,
        councilMode,
      }),
    })
    const result = await res.json()
    jobId = result.jobId
    statusEl.textContent = `🚀 Pipeline ${councilMode.toUpperCase()} iniciado`
  } catch (e) {
    statusEl.textContent = `❌ Erro ao iniciar: ${e.message}`
    runBtn.disabled = false
    return
  }

  // Clear steps
  stepsEl.innerHTML = ''

  // Connect SSE
  const sse = new EventSource(`${API_BASE}/api/pipeline/events/${jobId}`)
  const agentElements = {}

  sse.onmessage = (event) => {
    const msg = JSON.parse(event.data)

    switch (msg.type) {
      case 'connected':
        statusEl.textContent = '🔗 Conectado ao pipeline...'
        break

      case 'pipeline_start':
        statusEl.textContent = `⚡ Executando ${msg.totalAgents} agentes (${councilMode.toUpperCase()})...`
        break

      case 'agent_start':
        statusEl.textContent = `${msg.agentEmoji} Agente ${msg.agentId}: ${msg.agentNome}...`
        agentElements[msg.agentId] = addAgentStep(stepsEl, msg, 'running')
        break

      case 'agent_searching':
        statusEl.textContent = `🔍 Agente ${msg.agentId}: Pesquisando na web...`
        updateAgentStep(agentElements[msg.agentId], 'Pesquisando fontes na web...', 'searching')
        break

      case 'search_complete':
        updateAgentStep(agentElements[msg.agentId], `Encontrou ${msg.totalResults} fontes`, 'searched')
        break

      // Council events
      case 'council_mode':
        updateAgentStep(agentElements[msg.agentId], `Modo: ${msg.mode} · IAs: ${msg.ais?.join(', ')}`, 'thinking')
        break

      case 'council_fallback':
        updateAgentStep(agentElements[msg.agentId], `⚠️ Fallback API: ${msg.reason}`, 'thinking')
        break

      case 'ai_start':
        statusEl.textContent = `${msg.emoji || '🤖'} ${msg.name || msg.ai} processando... (${msg.current}/${msg.total})`
        updateAgentStep(agentElements[msg.agentId], `${msg.emoji || '🤖'} ${msg.name || msg.ai} respondendo... (${msg.current}/${msg.total})`, 'thinking')
        break

      case 'ai_thinking':
        updateAgentStep(agentElements[msg.agentId], `${msg.emoji || '🤖'} ${msg.name || msg.ai} gerando resposta...`, 'thinking')
        break

      case 'ai_complete':
        updateAgentStep(agentElements[msg.agentId], `${msg.emoji || '✅'} ${msg.name}: ${(msg.length / 1024).toFixed(1)} KB`, 'thinking')
        break

      case 'cascade_stage':
        statusEl.textContent = `🔗 CASCADE ${msg.stage}/${msg.total}: ${msg.emoji} ${msg.name}`
        updateAgentStep(agentElements[msg.agentId], `🔗 Estágio ${msg.stage}/${msg.total}: ${msg.emoji} ${msg.name}${msg.isLast ? ' (final)' : ''}`, 'thinking')
        break

      case 'cascade_stage_complete':
        updateAgentStep(agentElements[msg.agentId], `${msg.emoji} ${msg.name}: ${(msg.length / 1024).toFixed(1)} KB ✅`, 'thinking')
        break

      case 'council_merging':
        updateAgentStep(agentElements[msg.agentId], `🔄 Merge: combinando ${msg.responses} respostas...`, 'thinking')
        break

      case 'agent_thinking':
        statusEl.textContent = `🤖 Agente ${msg.agentId}: Processando...`
        updateAgentStep(agentElements[msg.agentId], 'Processando...', 'thinking')
        break

      case 'agent_complete':
        statusEl.textContent = `✅ Agente ${msg.agentId}: ${msg.agentNome} concluído!`
        completeAgentStep(agentElements[msg.agentId], msg)
        break

      case 'agent_error':
        updateAgentStep(agentElements[msg.agentId], `❌ Erro: ${msg.error}`, 'error')
        break

      case 'pipeline_complete':
        statusEl.textContent = `✅ Pipeline completo em ${msg.duration}s!`
        runBtn.disabled = false
        document.getElementById('pipeline-footer').innerHTML = `
          <div style="margin-bottom: var(--space-md); color: var(--niche-temperanca); font-weight: 600;">
            ✅ Pipeline ${councilMode.toUpperCase()} · ${msg.duration}s · ${msg.agents} agentes
          </div>
          <button class="btn btn-primary" id="view-outputs-btn">📂 Ver Outputs</button>
          <button class="btn" id="spawn-from-pipeline" style="margin-left: var(--space-sm);">🚀 Criar Canal</button>
        `
        document.getElementById('spawn-from-pipeline')?.addEventListener('click', () => {
          navigateTo('channel-spawner', { nicho: data.nicho })
        })
        sse.close()
        break
    }
  }

  sse.onerror = () => {
    statusEl.textContent = '⚠️ Conexão SSE perdida'
    sse.close()
    runBtn.disabled = false
  }
}

/**
 * Add an agent step to the pipeline
 */
function addAgentStep(container, msg, status) {
  const el = document.createElement('div')
  el.className = `pipeline-step ${status}`
  el.innerHTML = `
    <div class="step-dot">${msg.agentEmoji}</div>
    <div class="step-content">
      <div class="step-header">
        <span class="step-emoji">${msg.agentEmoji}</span>
        <span class="step-name">Agente ${msg.agentId}: ${msg.agentNome}</span>
        <span class="step-badge real">COUNCIL</span>
        <span class="step-spinner">⏳</span>
      </div>
      <div class="step-status">Iniciando...</div>
      <div class="step-council-ais" id="council-ais-${msg.agentId}"></div>
      <div class="step-output" style="display: none;"></div>
    </div>
  `
  container.appendChild(el)
  el.scrollIntoView({ behavior: 'smooth', block: 'end' })
  return el
}

function updateAgentStep(el, text, status) {
  if (!el) return
  el.querySelector('.step-status').textContent = text
  el.className = `pipeline-step ${status}`
}

function completeAgentStep(el, msg) {
  if (!el) return
  el.className = 'pipeline-step complete'
  el.querySelector('.step-spinner').textContent = '✅'

  const councilInfo = msg.councilMode
    ? `${msg.councilMode.toUpperCase()} · ${(msg.councilSources || []).join(' + ')}`
    : ''

  el.querySelector('.step-status').textContent = `Concluído (${(msg.outputLength / 1024).toFixed(1)} KB) ${councilInfo}`

  // Add expandable output
  const outputEl = el.querySelector('.step-output')
  outputEl.style.display = 'block'
  outputEl.innerHTML = `
    <details>
      <summary style="cursor: pointer; color: var(--text-accent); margin-bottom: var(--space-sm);">
        📄 Ver output (${(msg.outputLength / 1024).toFixed(1)} KB)
        ${msg.councilAnalysis ? `<span style="font-size: 0.7rem; color: var(--text-muted);"> · ${msg.councilAnalysis}</span>` : ''}
      </summary>
      <pre style="white-space: pre-wrap; font-size: 0.75rem; max-height: 400px; overflow-y: auto; padding: var(--space-md); background: var(--bg-primary); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">${escapeHtml(msg.outputPreview)}${msg.outputLength > 500 ? '\n\n... [ver output completo no workspace]' : ''}</pre>
    </details>
  `
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderObj(obj, depth = 0) {
  let html = '<ul style="list-style:none;padding-left:' + (depth * 12) + 'px;">'
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      html += `<li><strong style="color:var(--text-accent);">${fmtKey(key)}:</strong></li>`
      value.forEach(item => {
        html += typeof item === 'object' ? `<li>${renderObj(item, depth + 1)}</li>` : `<li style="padding-left:12px;">• ${item}</li>`
      })
    } else if (typeof value === 'object' && value !== null) {
      html += `<li><strong style="color:var(--text-accent);">${fmtKey(key)}:</strong></li>${renderObj(value, depth + 1)}`
    } else {
      html += `<li><strong style="color:var(--text-accent);">${fmtKey(key)}:</strong> ${value}</li>`
    }
  }
  return html + '</ul>'
}

function fmtKey(k) {
  return k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()).trim()
}
