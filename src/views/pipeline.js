/**
 * Pipeline View V3 — AI Council with SOLO/COUNCIL/CASCADE modes
 * Falls back to mock pipeline if backend is not running
 */

import { runPipeline as runMockPipeline } from '../pipeline-runner.js'
import { navigateTo } from '../main.js'
import { API_BASE } from '../config.js'
import { escapeHtml, renderObj } from '../utils.js'
import { Button, Badge } from '../components/ui.js'

export function renderPipeline(container, data = {}) {
  if (!data.nicho || !data.angulo) {
    navigateTo('landing')
    return
  }

  container.innerHTML = `
    <div class="px-6 py-6 max-w-5xl mx-auto sm:px-4 sm:py-4">
      <button class="text-sm text-gray-400 hover:text-white mb-8 sm:mb-6 transition-colors flex items-center gap-2" id="back-btn">
        <span>←</span> Voltar
      </button>

      <div class="text-center mb-12 sm:mb-8">
        <div class="h-1 rounded-full mx-auto mb-6" style="background: linear-gradient(90deg, ${data.nicho.cor}, ${data.nicho.corSecundaria}); max-width: 200px;"></div>
        <h1 class="text-3xl font-black mb-2 text-white">⚡ Pipeline de Produção</h1>
        <p class="text-gray-400 mb-6">${data.nicho.emoji} ${data.nicho.nome} · ${data.formato?.icone || '📹'} ${data.formato?.nome || 'Todos'}</p>
        <div class="text-lg font-semibold leading-relaxed p-4 border-l-4 border-violet-500 text-white italic max-w-2xl mx-auto">"${data.angulo}"</div>
      </div>

      <!-- Council Mode Selector -->
      <div class="bg-[#0d0d1a]/80 backdrop-blur border border-white/10 rounded-2xl p-6 sm:p-4 mb-8 flex flex-col items-center gap-6" id="council-selector">
        <span class="text-sm font-bold text-gray-300 tracking-wider uppercase">🧠 Modo do Conselho:</span>
        <div class="flex flex-wrap justify-center gap-4 sm:gap-2">
          <button class="council-mode-btn bg-white/5 border border-white/10 text-gray-400 px-6 py-3 sm:px-4 sm:py-2 rounded-xl flex items-center gap-3 transition-all duration-300 hover:bg-white/10 hover:border-violet-500/30 active group" data-mode="solo" title="1 IA responde" aria-label="Modo Solo — uma IA responde">
            <span class="text-xl group-[.active]:scale-110 transition-transform">🎯</span>
            <span class="font-bold tracking-wide group-[.active]:text-violet-400">SOLO</span>
          </button>
          <button class="council-mode-btn bg-white/5 border border-white/10 text-gray-400 px-6 py-3 sm:px-4 sm:py-2 rounded-xl flex items-center gap-3 transition-all duration-300 hover:bg-white/10 hover:border-violet-500/30 group" data-mode="council" title="3 IAs respondem & merge" aria-label="Modo Council — três IAs em paralelo">
            <span class="text-xl group-[.active]:scale-110 transition-transform">👥</span>
            <span class="font-bold tracking-wide group-[.active]:text-violet-400">COUNCIL</span>
          </button>
          <button class="council-mode-btn bg-white/5 border border-white/10 text-gray-400 px-6 py-3 sm:px-4 sm:py-2 rounded-xl flex items-center gap-3 transition-all duration-300 hover:bg-white/10 hover:border-violet-500/30 group" data-mode="cascade" title="Cada IA refina a anterior" aria-label="Modo Cascade — três IAs em sequência">
            <span class="text-xl group-[.active]:scale-110 transition-transform">🔗</span>
            <span class="font-bold tracking-wide group-[.active]:text-violet-400">CASCADE</span>
          </button>
        </div>
        <div class="flex flex-wrap justify-center gap-4 sm:gap-2" id="council-ais">
          <span class="ai-indicator flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold transition-all" data-ai="chatgpt">💚 ChatGPT</span>
          <span class="ai-indicator flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold transition-all" data-ai="claude">🟠 Claude</span>
          <span class="ai-indicator flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold transition-all" data-ai="gemini">🔵 Gemini</span>
        </div>
      </div>

      <div class="flex flex-col items-center gap-4 mb-12">
        <div class="flex flex-wrap justify-center gap-4 w-full">
          ${Button({ id: 'run-real-btn', text: 'Executar Pipeline', icon: '🚀', variant: 'primary', extraClasses: 'sm:w-full sm:justify-center' })}
          ${Button({ id: 'run-mock-btn', text: 'Preview (Mock)', icon: '📄', variant: 'secondary', extraClasses: 'sm:w-full sm:justify-center' })}
        </div>
        <span id="pipeline-status" class="text-sm text-gray-400 font-mono mt-2"></span>
      </div>

      <div class="flex flex-col gap-6" id="pipeline-steps"></div>

      <div class="text-center mt-16" id="pipeline-footer"></div>
    </div>
  `

  let selectedMode = 'solo'

  // Mode selector - simplified the custom styles from legacy css, handled active states inline
  container.querySelectorAll('.council-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.council-mode-btn').forEach(b => {
        b.classList.remove('active', 'border-violet-500/50', 'bg-violet-500/10')
      })
      btn.classList.add('active', 'border-violet-500/50', 'bg-violet-500/10')
      selectedMode = btn.dataset.mode
    })
  })

  // Set initial active state correctly
  container.querySelector('.council-mode-btn[data-mode="solo"]').classList.add('border-violet-500/50', 'bg-violet-500/10')

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

      if (available) {
        el.classList.add('border-emerald-500/30', 'text-emerald-400')
        el.classList.remove('opacity-50', 'text-gray-500')
      } else {
        el.classList.add('opacity-50', 'text-gray-500')
        el.classList.remove('border-emerald-500/30', 'text-emerald-400')
      }
    })

    if (!council?.connected) {
      document.getElementById('pipeline-status').innerHTML =
        `⚠️ Chrome não conectado. Execute: <code class="bg-white/10 px-1 rounded text-violet-300">npm run chrome</code>`
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

  document.getElementById('pipeline-footer').innerHTML = Button({
    text: 'Rodar com Conselho Real',
    icon: '🚀',
    variant: 'primary',
    attrs: `onclick="document.getElementById('run-real-btn').click()"`
  })
}

function renderMockStep(step, index) {
  const delay = index * 100
  const output = { ...step }
  delete output.agentId; delete output.agentNome; delete output.agentEmoji
  delete output.agentDescricao; delete output.titulo; delete output.status

  return `
    <div class="relative pl-12 sm:pl-8 animate-[fade-up_0.5s_ease-out_both]" style="animation-delay: ${delay}ms">
      <div class="absolute left-0 top-6 w-8 h-8 sm:w-6 sm:h-6 rounded-full bg-[#1a1a2e] border-2 border-violet-500/30 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(139,92,246,0.2)] z-10 -translate-y-1/2">${step.agentEmoji}</div>
      <div class="absolute left-4 top-10 bottom-[-24px] w-px bg-white/10 sm:left-3"></div>
      
      <div class="bg-[#0f0f1e]/80 backdrop-blur-md border border-[rgba(100,100,180,0.15)] rounded-xl overflow-hidden transition-all duration-300 hover:border-violet-500/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div class="flex flex-wrap items-center gap-3 p-4 bg-white/5 border-b border-white/5">
          <span class="text-xl">${step.agentEmoji}</span>
          <span class="font-semibold text-white">${step.agentNome}</span>
          ${Badge({ text: 'MOCK', color: 'orange', extraClasses: 'ml-auto' })}
        </div>
        <div class="p-4 bg-black/20 font-mono text-sm sm:text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">${renderObj(output)}</div>
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
      statusEl.innerHTML = `⚠️ Chrome não conectado para modo ${councilMode.toUpperCase()}. Execute: <code class="bg-white/10 px-1 rounded text-violet-300">npm run chrome</code> e abra <code class="bg-white/10 px-1 rounded">chatgpt.com</code>, <code class="bg-white/10 px-1 rounded">claude.ai</code>, <code class="bg-white/10 px-1 rounded">gemini.google.com</code>`
      runBtn.disabled = false
      return
    }

    if (council?.connected) {
      const available = council.totalAvailable || 0
      statusEl.textContent = `✅ ${available} IAs disponíveis · Modo: ${councilMode.toUpperCase()}`
    } else if (health.llm?.ok) {
      statusEl.textContent = `✅ Fallback: ${health.llm.provider} (${health.llm.model || ''})`
    } else {
      statusEl.innerHTML = `❌ Nenhuma IA disponível. Abra Chrome com <code class="bg-white/10 px-1 rounded text-violet-300">npm run chrome</code> ou configure API key.`
      runBtn.disabled = false
      return
    }
  } catch (e) {
    statusEl.innerHTML = `❌ Backend offline. Execute: <code class="bg-white/10 px-1 rounded text-violet-300">npm run server</code>`
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
        updateAgentStep(agentElements[msg.agentId], `❌ Erro: ${msg.error}`, 'error', 'border-red-500/50')
        break

      case 'pipeline_complete':
        statusEl.textContent = `✅ Pipeline completo em ${msg.duration}s!`
        runBtn.disabled = false
        document.getElementById('pipeline-footer').innerHTML = `
          <div class="mb-6 text-emerald-400 font-semibold tracking-wide flex items-center justify-center gap-2">
            <span>✅ Pipeline ${councilMode.toUpperCase()}</span>
            <span class="text-white/30">•</span>
            <span>${msg.duration}s</span>
            <span class="text-white/30">•</span>
            <span>${msg.agents} agentes</span>
          </div>
          <div class="flex justify-center gap-4 flex-wrap">
            ${Button({ id: 'view-outputs-btn', text: 'Ver Outputs', icon: '📂', variant: 'primary' })}
            ${Button({ id: 'spawn-from-pipeline', text: 'Criar Canal', icon: '🚀', variant: 'secondary' })}
          </div>
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
  el.className = `relative pl-12 sm:pl-8 animate-[fade-up_0.5s_ease-out]`
  el.innerHTML = `
    <div class="absolute left-0 top-6 w-8 h-8 sm:w-6 sm:h-6 rounded-full bg-[#1a1a2e] border-2 border-violet-500/30 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(139,92,246,0.2)] z-10 -translate-y-1/2">${msg.agentEmoji}</div>
    <div class="absolute left-4 top-10 bottom-[-24px] w-px bg-white/10 sm:left-3"></div>
    
    <div class="bg-white/5 backdrop-blur-md border border-[rgba(100,100,180,0.15)] rounded-xl overflow-hidden transition-all duration-300 shadow-sm">
      <div class="flex flex-wrap items-center gap-3 p-4 border-b border-white/5">
        <span class="text-xl">${msg.agentEmoji}</span>
        <span class="font-semibold text-white tracking-wide">Agente ${msg.agentId}: ${msg.agentNome}</span>
        ${Badge({ text: 'COUNCIL', color: 'violet', extraClasses: 'ml-auto shadow-[0_0_10px_rgba(139,92,246,0.2)]' })}
        <span class="step-spinner w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
      <div class="p-4 bg-black/20">
        <div class="step-status text-sm text-gray-400 font-mono flex items-center gap-2">Iniciando...</div>
        <div class="hidden step-council-ais" id="council-ais-${msg.agentId}"></div>
        <div class="step-output hidden mt-4 border-t border-white/10 pt-4"></div>
      </div>
    </div>
  `
  container.appendChild(el)
  el.scrollIntoView({ behavior: 'smooth', block: 'end' })
  return el
}

function updateAgentStep(el, text, status, extraBorderClass = '') {
  if (!el) return
  el.querySelector('.step-status').textContent = text

  const card = el.children[2]
  card.className = `bg-white/5 backdrop-blur-md border border-[rgba(100,100,180,0.15)] rounded-xl overflow-hidden transition-all duration-300 shadow-sm ${extraBorderClass}`

  if (status === 'thinking') {
    card.classList.add('border-violet-500/50', 'bg-violet-500/[0.02]', 'shadow-[0_0_20px_rgba(139,92,246,0.1)]')
  }
}

function completeAgentStep(el, msg) {
  if (!el) return

  const card = el.children[2]
  card.className = `bg-[#0f0f1e]/80 backdrop-blur-md border border-emerald-500/30 rounded-xl overflow-hidden transition-all duration-500 shadow-[0_4px_20px_rgba(16,185,129,0.15)]`

  const spinnerContainer = el.querySelector('.step-spinner').parentElement
  el.querySelector('.step-spinner').remove()
  spinnerContainer.innerHTML += '<span class="text-emerald-400 animate-[scale-up_0.3s_ease-out]">✅</span>'

  const councilInfo = msg.councilMode
    ? `${msg.councilMode.toUpperCase()} · ${(msg.councilSources || []).join(' + ')}`
    : ''

  const statusEl = el.querySelector('.step-status')
  statusEl.innerHTML = `<span class="text-emerald-400">Concluído</span> <span class="text-white/30 truncate ml-2">(${(msg.outputLength / 1024).toFixed(1)} KB) ${councilInfo}</span>`

  // Add expandable output
  const outputEl = el.querySelector('.step-output')
  outputEl.classList.remove('hidden')
  outputEl.innerHTML = `
    <details class="group">
      <summary class="cursor-pointer text-violet-400 hover:text-violet-300 font-medium text-sm flex items-center gap-2 transition-colors select-none">
        <span class="group-open:rotate-90 transition-transform">▶</span> Ver output 
        <span class="text-white/30 text-xs font-normal">(${(msg.outputLength / 1024).toFixed(1)} KB)</span>
        ${msg.councilAnalysis ? `<span class="text-gray-500 text-xs ml-auto truncate font-normal hidden sm:inline-block max-w-[120px]">· ${msg.councilAnalysis}</span><span class="text-gray-500 text-xs ml-auto truncate font-normal sm:hidden">· ${msg.councilAnalysis}</span>` : ''}
      </summary>
      <div class="mt-4 p-4 bg-black/40 rounded-lg border border-white/5 max-h-[400px] overflow-y-auto">
        <pre class="whitespace-pre-wrap font-mono text-xs text-gray-300 leading-relaxed">${escapeHtml(msg.outputPreview)}${msg.outputLength > 500 ? '\n\n... [ver output completo no workspace]' : ''}</pre>
      </div>
    </details>
  `
}
