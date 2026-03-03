/**
 * Landing View — Premium Command Center
 * Live system status + dice roller + recent activity
 */

import { feelingLucky, getTaxonomyStats, getAllNichos } from '../dice-engine.js'
import { navigateTo, updateNavStats } from '../main.js'
import { API_BASE } from '../config.js'
import { Button, GlassCard, Badge } from '../components/ui.js'

export function renderLanding(container) {
  getTaxonomyStats().then(stats => {
    buildLanding(container, stats)
  })
}

async function buildLanding(container, stats) {
  const nichos = getAllNichos()

  container.innerHTML = `
    <div class="flex flex-col items-center min-h-[calc(100vh-72px)] px-6 sm:px-4 md:px-8 py-10 pb-20 gap-12 sm:gap-8">
      
      <!-- System Status Bar -->
      <div class="flex flex-wrap justify-center gap-6 sm:gap-4 px-6 sm:px-4 py-2 bg-[#0f0f1e]/60 backdrop-blur-md border border-white/10 rounded-full animate-[fade-up_0.6s_ease-out_0.1s_both]" id="sys-status">
        <div class="flex items-center gap-1.5 text-xs font-mono text-gray-400" id="sys-backend">
          <span class="w-2 h-2 rounded-full sys-dot sys-dot--checking bg-gray-500 animate-pulse"></span>
          <span class="whitespace-nowrap sys-label">Backend</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs font-mono text-gray-400" id="sys-council">
          <span class="w-2 h-2 rounded-full sys-dot sys-dot--checking bg-gray-500 animate-pulse"></span>
          <span class="whitespace-nowrap sys-label">Council</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs font-mono text-gray-400" id="sys-llm">
          <span class="w-2 h-2 rounded-full sys-dot sys-dot--checking bg-gray-500 animate-pulse"></span>
          <span class="whitespace-nowrap sys-label">LLM</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs font-mono text-gray-400" id="sys-db">
          <span class="w-2 h-2 rounded-full sys-dot sys-dot--checking bg-gray-500 animate-pulse"></span>
          <span class="whitespace-nowrap sys-label">Database</span>
        </div>
      </div>

      <!-- Hero Section -->
      <div class="text-center relative animate-[fade-up_0.8s_ease-out_0.2s_both]">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[radial-gradient(ellipse,rgba(139,92,246,0.08)_0%,transparent_70%)] pointer-events-none -z-10 sm:w-[300px]"></div>
        <p class="text-sm font-semibold tracking-[6px] uppercase text-violet-400 mb-4 sm:mb-2 text-center">O Cérebro Criativo</p>
        <h1 class="text-[clamp(2.5rem,6vw,4rem)] font-black leading-tight mb-4 bg-gradient-to-br from-indigo-100 via-violet-400 to-blue-400 bg-clip-text text-transparent">BRAINET</h1>
        <p class="text-base sm:text-sm text-gray-400 max-w-[550px] mx-auto leading-relaxed px-4">
          Um organismo vivo de produção de conteúdo. Cada nicho carrega subtemas,
          formatos e infinitos ângulos — prontos para se tornarem canais, comunidades,
          lojas e ferramentas.
        </p>
      </div>

      <!-- Dice Section -->
      <div class="flex flex-col items-center animate-[fade-up_0.8s_ease-out_0.4s_both]">
        <div class="relative w-[240px] h-[240px] sm:w-[200px] sm:h-[200px]" id="dice-orbit">
          ${nichos.slice(0, 8).map((n, i) => `
            <div class="absolute top-1/2 left-1/2 w-9 h-9 flex items-center justify-center text-lg rounded-full bg-white/5 border border-white/10 transition-all duration-500 hover:scale-125 z-10" 
                 style="transform: translate(-50%, -50%) rotate(calc(360deg / 8 * ${i})) translateY(-100px) rotate(calc(-360deg / 8 * ${i})); box-shadow: 0 0 12px color-mix(in srgb, ${n.cor} 30%, transparent);" 
                 title="${n.nome}">
              ${n.emoji}
            </div>
          `).join('')}
          <button class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full border-2 border-violet-500/30 bg-white/5 backdrop-blur-md cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] active:scale-95 z-[5] overflow-hidden group" id="dice-btn" aria-label="I'm Feeling Lucky">
            <span class="text-4xl transition-transform duration-500 group-hover:rotate-180 dice-icon-inner">🎲</span>
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-4 tracking-wide">Clique para explorar um nicho aleatório</p>
      </div>

      <!-- Stats Section -->
      <div class="flex flex-wrap justify-center gap-4 animate-[fade-up_0.8s_ease-out_0.6s_both] w-full max-w-4xl">
        ${[
      { label: 'Nichos', val: stats.nichos, color: 'bg-violet-500', shadow: 'shadow-violet-500/50', w: '100%' },
      { label: 'Subtemas', val: stats.subtemas, color: 'bg-cyan-500', shadow: 'shadow-cyan-500/50', w: '80%' },
      { label: 'Formatos', val: stats.formatos, color: 'bg-blue-500', shadow: 'shadow-blue-500/50', w: '60%' },
      { label: 'Ângulos', val: stats.angulos, color: 'bg-pink-500', shadow: 'shadow-pink-500/50', w: '90%' },
      { label: 'Rolls', val: stats.explorations, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/50', w: '40%' }
    ].map(s => `
          ${GlassCard({
      extraClasses: 'min-w-[120px] sm:min-w-[100px] text-center flex-1', children: `
            <div class="text-3xl font-black font-mono text-violet-400 mb-1 stat-number" data-target="${s.val}">0</div>
            <div class="text-[0.7rem] font-bold tracking-[2px] uppercase text-gray-500 mb-2">${s.label}</div>
            <div class="h-[3px] bg-white/5 rounded-sm overflow-hidden">
              <div class="h-full rounded-sm ${s.color} ${s.shadow} shadow-[0_0_8px] transition-[width] duration-1000 ease-out" style="width: ${s.w};"></div>
            </div>
          `})}
        `).join('')}
      </div>

      <!-- Council Preview -->
      <div class="w-full max-w-[600px] animate-[fade-up_0.8s_ease-out_0.8s_both]">
        <h3 class="flex items-center gap-2 text-base font-bold text-white mb-6">
          <span class="text-xl">🧠</span> Conselho de IAs
        </h3>
        <div class="grid grid-cols-3 sm:grid-cols-1 gap-4">
          ${[
      { id: 'chatgpt', name: 'ChatGPT', emoji: '💚' },
      { id: 'claude', name: 'Claude', emoji: '🟠' },
      { id: 'gemini', name: 'Gemini', emoji: '🔵' },
    ].map(ai => GlassCard({
      id: `cc-${ai.id}`, extraClasses: 'text-center cc-card', children: `
            <div class="text-3xl mb-2">${ai.emoji}</div>
            <div class="text-sm font-bold text-white mb-1">${ai.name}</div>
            <div class="text-xs font-mono text-gray-500 council-status">Verificando...</div>
          `})).join('')}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-wrap justify-center gap-4 animate-[fade-up_0.8s_ease-out_1s_both] w-full max-w-2xl sm:flex-col sm:px-4">
        ${Button({ text: 'Criar Canal', icon: '🌊', variant: 'secondary', extraClasses: 'qa-btn', attrs: 'data-view="channel-spawner"' })}
        ${Button({ text: 'Ver Grafo', icon: '🕸️', variant: 'secondary', extraClasses: 'qa-btn', attrs: 'data-view="graph"' })}
        ${Button({ text: 'Histórico', icon: '📋', variant: 'secondary', extraClasses: 'qa-btn', attrs: 'data-view="jobs"' })}
        ${Button({ text: 'Estatísticas', icon: '📊', variant: 'secondary', extraClasses: 'qa-btn', attrs: 'data-view="stats"' })}
      </div>
    </div>
  `

  // --- Animated stat counters ---
  animateCounters(container)

  // --- Dice click handler ---
  const diceBtn = document.getElementById('dice-btn')
  diceBtn.addEventListener('click', () => {
    const icon = diceBtn.querySelector('.dice-icon-inner')
    icon.classList.add('animate-[spin_0.6s_ease-in-out_3]')

    // Simple rotation animation for orbit
    const orbit = document.getElementById('dice-orbit')
    if (orbit) orbit.style.animation = 'spin 1.5s linear'

    setTimeout(() => {
      const result = feelingLucky()
      icon.classList.remove('animate-[spin_0.6s_ease-in-out_3]')
      if (orbit) orbit.style.animation = ''
      updateNavStats()
      showResultOverlay(result)
    }, 1800)
  })

  // --- Quick actions ---
  container.querySelectorAll('.qa-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view))
  })

  // --- System health check ---
  checkSystemHealth()
}

/**
 * Animate stat counters from 0 to target
 */
function animateCounters(container) {
  const counters = container.querySelectorAll('.stat-number')
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target) || 0
    const duration = 1500
    const start = performance.now()

    function update(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      counter.textContent = Math.round(target * eased).toLocaleString()
      if (progress < 1) requestAnimationFrame(update)
    }

    requestAnimationFrame(update)
  })
}

/**
 * Check system health and update status indicators
 */
async function checkSystemHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) })
    const health = await res.json()

    // Backend
    setStatus('sys-backend', true, 'Online')

    // Council
    const council = health.council
    if (council?.connected) {
      const count = council.totalAvailable || 0
      setStatus('sys-council', count > 0, count > 0 ? `${count} IAs` : 'Sem IAs')

        // Individual AI cards
        ;['chatgpt', 'claude', 'gemini'].forEach(ai => {
          const el = document.getElementById(`cc-${ai}`)
          if (!el) return
          const available = council.ais?.[ai]?.available

          if (available) {
            el.classList.add('border-emerald-500/30')
            el.querySelector('.council-status').classList.replace('text-gray-500', 'text-emerald-500')
            el.querySelector('.council-status').textContent = 'Online'
          } else {
            el.classList.add('opacity-50')
            el.querySelector('.council-status').classList.replace('text-gray-500', 'text-red-500')
            el.querySelector('.council-status').textContent = 'Offline'
          }
        })
    } else {
      setStatus('sys-council', false, 'Desconectado')
        ;['chatgpt', 'claude', 'gemini'].forEach(ai => {
          const el = document.getElementById(`cc-${ai}`)
          if (!el) return
          el.classList.add('opacity-50')
          el.querySelector('.council-status').classList.replace('text-gray-500', 'text-red-500')
          el.querySelector('.council-status').textContent = 'Chrome offline'
        })
    }

    // LLM
    if (health.llm?.ok) {
      setStatus('sys-llm', true, health.llm.provider)
    } else {
      setStatus('sys-llm', false, 'Sem config')
    }

    // Database
    if (health.database?.connected) {
      setStatus('sys-db', true, 'Supabase')
    } else {
      setStatus('sys-db', null, 'JSON local')
    }

  } catch {
    setStatus('sys-backend', false, 'Offline')
    setStatus('sys-council', false, '—')
    setStatus('sys-llm', false, '—')
    setStatus('sys-db', false, '—')
  }
}

function setStatus(id, ok, label) {
  const el = document.getElementById(id)
  if (!el) return
  const dot = el.querySelector('.sys-dot')

  dot.className = 'w-2 h-2 rounded-full sys-dot flex-shrink-0 '
  if (ok === true) {
    dot.className += 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
  } else if (ok === null) {
    dot.className += 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
  } else {
    dot.className += 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
  }

  el.querySelector('.sys-label').textContent = label
}

/**
 * Result overlay (rewritten with premium design)
 */
function showResultOverlay(result) {
  const triggerElement = document.activeElement || document.querySelector('#dice-btn')

  const overlay = document.createElement('div')
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-[#06060e]/90 backdrop-blur-xl animate-[fade-in_0.3s_ease-out]'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-labelledby', 'result-overlay-title')

  const cardContent = `
        <div class= "h-[3px] rounded-full mb-6" style = "background: linear-gradient(90deg, ${result.nicho.cor}, ${result.nicho.corSecundaria})" ></div>

    <div class="flex items-center gap-4 mb-6">
      <div class="text-5xl w-[70px] h-[70px] flex items-center justify-center rounded-xl bg-white/5 transition-shadow duration-300" style="border: 1px solid ${result.nicho.cor}30; box-shadow: 0 0 30px ${result.nicho.cor}20;">
        ${result.nicho.emoji}
      </div>
      <div>
        <h2 id="result-overlay-title" class="text-2xl font-bold mb-1" style="color: ${result.nicho.cor}">${result.nicho.nome}</h2>
        <p class="text-sm text-gray-400">${result.nicho.arquetipo} · ${result.nicho.virtudePromovida}</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-6 p-4 bg-[#0d0d1a] rounded-lg font-mono text-sm sm:text-xs">
      <span class="font-bold text-violet-400">${result.nicho.nome}</span>
      <span class="text-gray-500">→</span>
      <span class="font-bold text-violet-400">${result.subtema.nome}</span>
      <span class="text-gray-500">→</span>
      <span class="font-bold text-violet-400">${result.formato.icone} ${result.formato.nome}</span>
    </div>

    <div class="text-lg font-semibold leading-relaxed mb-8 p-4 border-l-4 border-violet-500 text-white italic">
      "${result.angulo}"
    </div>

    <div class="flex flex-wrap gap-4 sm:flex-col justify-end">
      ${Button({ id: 'result-explore', text: 'Explorar Nicho', icon: '🕸️', variant: 'primary', extraClasses: 'sm:w-full sm:justify-center' })}
      ${Button({ id: 'result-pipeline', text: 'Rodar Pipeline', icon: '⚡', variant: 'secondary', extraClasses: 'sm:w-full sm:justify-center' })}
      ${Button({ id: 'result-spawn', text: 'Criar Canal', icon: '🚀', variant: 'secondary', extraClasses: 'sm:w-full sm:justify-center' })}
      ${Button({ id: 'result-reroll', text: 'Jogar de Novo', icon: '🎲', variant: 'ghost', extraClasses: 'sm:w-full sm:justify-center' })}
      ${Button({ id: 'result-close', text: 'Fechar', icon: '✕', variant: 'danger', extraClasses: 'sm:w-full sm:justify-center' })}
    </div>
  `;

  overlay.innerHTML = GlassCard({ extraClasses: 'w-[min(90vw,700px)] animate-[scale-up_0.5s_cubic-bezier(0.34,1.56,0.64,1)]', children: cardContent });

  document.body.appendChild(overlay)

  // Focus trap
  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  const getFocusableElements = () => overlay.querySelectorAll(focusableSelector)

  setTimeout(() => {
    const firstFocusable = getFocusableElements()[0]
    if (firstFocusable) firstFocusable.focus()
  }, 50)

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { closeOverlay(); return }
    if (e.key !== 'Tab') return

    const focusableElements = getFocusableElements()
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === firstElement) { e.preventDefault(); lastElement.focus() }
    } else {
      if (document.activeElement === lastElement) { e.preventDefault(); firstElement.focus() }
    }
  }

  const closeOverlay = () => {
    overlay.removeEventListener('keydown', handleKeyDown)
    overlay.remove()
    if (triggerElement?.focus) triggerElement.focus()
  }

  overlay.addEventListener('keydown', handleKeyDown)
  overlay.querySelector('#result-close').addEventListener('click', closeOverlay)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay() })

  overlay.querySelector('#result-explore').addEventListener('click', () => {
    closeOverlay()
    navigateTo('niche-detail', { nicho: result.nicho })
  })

  overlay.querySelector('#result-pipeline').addEventListener('click', () => {
    closeOverlay()
    navigateTo('pipeline', result)
  })

  overlay.querySelector('#result-spawn').addEventListener('click', () => {
    closeOverlay()
    navigateTo('channel-spawner', { nicho: result.nicho })
  })

  overlay.querySelector('#result-reroll').addEventListener('click', () => {
    closeOverlay()
    const newResult = feelingLucky()
    updateNavStats()
    showResultOverlay(newResult)
  })
}
