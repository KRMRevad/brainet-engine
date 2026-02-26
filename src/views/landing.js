/**
 * Landing View — Premium Command Center
 * Live system status + dice roller + recent activity
 */

import { feelingLucky, getTaxonomyStats, getAllNichos } from '../dice-engine.js'
import { navigateTo, updateNavStats } from '../main.js'
import { API_BASE } from '../config.js'

export function renderLanding(container) {
  getTaxonomyStats().then(stats => {
    buildLanding(container, stats)
  })
}

async function buildLanding(container, stats) {
  const nichos = getAllNichos()

  container.innerHTML = `
    <div class="landing">
      <!-- System Status Bar -->
      <div class="sys-status-bar" id="sys-status">
        <div class="sys-status-item" id="sys-backend">
          <span class="sys-dot sys-dot--checking"></span>
          <span class="sys-label">Backend</span>
        </div>
        <div class="sys-status-item" id="sys-council">
          <span class="sys-dot sys-dot--checking"></span>
          <span class="sys-label">Council</span>
        </div>
        <div class="sys-status-item" id="sys-llm">
          <span class="sys-dot sys-dot--checking"></span>
          <span class="sys-label">LLM</span>
        </div>
        <div class="sys-status-item" id="sys-db">
          <span class="sys-dot sys-dot--checking"></span>
          <span class="sys-label">Database</span>
        </div>
      </div>

      <!-- Hero Section -->
      <div class="landing-hero">
        <div class="hero-glow"></div>
        <p class="landing-subtitle">O Cérebro Criativo</p>
        <h1 class="landing-title">BRAINET</h1>
        <p class="landing-description">
          Um organismo vivo de produção de conteúdo. Cada nicho carrega subtemas,
          formatos e infinitos ângulos — prontos para se tornarem canais, comunidades,
          lojas e ferramentas.
        </p>
      </div>

      <!-- Dice Section -->
      <div class="dice-section">
        <div class="dice-orbit" id="dice-orbit">
          ${nichos.slice(0, 8).map((n, i) => `
            <div class="orbit-node" style="--i: ${i}; --total: 8; --color: ${n.cor};" title="${n.nome}">
              ${n.emoji}
            </div>
          `).join('')}
          <button class="dice-btn-new" id="dice-btn" aria-label="I'm Feeling Lucky">
            <span class="dice-icon-inner">🎲</span>
            <span class="dice-pulse"></span>
          </button>
        </div>
        <p class="dice-hint">Clique para explorar um nicho aleatório</p>
      </div>

      <!-- Stats Section -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number" data-target="${stats.nichos}">0</div>
          <div class="stat-name">Nichos</div>
          <div class="stat-bar" style="--bar-color: var(--niche-espiritualidade);"><div class="stat-bar-fill" style="width: 100%;"></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-number" data-target="${stats.subtemas}">0</div>
          <div class="stat-name">Subtemas</div>
          <div class="stat-bar" style="--bar-color: var(--niche-saude);"><div class="stat-bar-fill" style="width: 80%;"></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-number" data-target="${stats.formatos}">0</div>
          <div class="stat-name">Formatos</div>
          <div class="stat-bar" style="--bar-color: var(--niche-tech);"><div class="stat-bar-fill" style="width: 60%;"></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-number" data-target="${stats.angulos}">0</div>
          <div class="stat-name">Ângulos</div>
          <div class="stat-bar" style="--bar-color: var(--niche-filosofia);"><div class="stat-bar-fill" style="width: 90%;"></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-number" data-target="${stats.explorations}">0</div>
          <div class="stat-name">Rolls</div>
          <div class="stat-bar" style="--bar-color: var(--niche-temperanca);"><div class="stat-bar-fill" style="width: 40%;"></div></div>
        </div>
      </div>

      <!-- Council Preview -->
      <div class="council-preview">
        <h3 class="section-title">
          <span class="section-icon">🧠</span>
          Conselho de IAs
        </h3>
        <div class="council-grid">
          <div class="council-card" id="cc-chatgpt">
            <div class="council-avatar">💚</div>
            <div class="council-name">ChatGPT</div>
            <div class="council-status">Verificando...</div>
          </div>
          <div class="council-card" id="cc-claude">
            <div class="council-avatar">🟠</div>
            <div class="council-name">Claude</div>
            <div class="council-status">Verificando...</div>
          </div>
          <div class="council-card" id="cc-gemini">
            <div class="council-avatar">🔵</div>
            <div class="council-name">Gemini</div>
            <div class="council-status">Verificando...</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="qa-btn" data-view="channel-spawner">
          <span class="qa-icon">🌊</span>
          <span class="qa-text">Criar Canal</span>
        </button>
        <button class="qa-btn" data-view="graph">
          <span class="qa-icon">🕸️</span>
          <span class="qa-text">Ver Grafo</span>
        </button>
        <button class="qa-btn" data-view="jobs">
          <span class="qa-icon">📋</span>
          <span class="qa-text">Histórico</span>
        </button>
        <button class="qa-btn" data-view="stats">
          <span class="qa-icon">📊</span>
          <span class="qa-text">Estatísticas</span>
        </button>
      </div>
    </div>
  `

  // --- Animated stat counters ---
  animateCounters(container)

  // --- Dice click handler ---
  const diceBtn = document.getElementById('dice-btn')
  diceBtn.addEventListener('click', () => {
    diceBtn.classList.add('rolling')
    document.getElementById('dice-orbit')?.classList.add('spinning')

    setTimeout(() => {
      const result = feelingLucky()
      diceBtn.classList.remove('rolling')
      document.getElementById('dice-orbit')?.classList.remove('spinning')
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
        el.classList.toggle('available', available)
        el.classList.toggle('unavailable', !available)
        el.querySelector('.council-status').textContent = available ? 'Online' : 'Offline'
      })
    } else {
      setStatus('sys-council', false, 'Desconectado')
      ;['chatgpt', 'claude', 'gemini'].forEach(ai => {
        const el = document.getElementById(`cc-${ai}`)
        if (!el) return
        el.classList.add('unavailable')
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
  dot.classList.remove('sys-dot--checking', 'sys-dot--ok', 'sys-dot--warn', 'sys-dot--fail')
  if (ok === true) dot.classList.add('sys-dot--ok')
  else if (ok === null) dot.classList.add('sys-dot--warn')
  else dot.classList.add('sys-dot--fail')
  el.querySelector('.sys-label').textContent = label
}

/**
 * Result overlay (rewritten with premium design)
 */
function showResultOverlay(result) {
  const triggerElement = document.activeElement || document.querySelector('#dice-btn')

  const overlay = document.createElement('div')
  overlay.className = 'result-overlay'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-labelledby', 'result-overlay-title')
  overlay.innerHTML = `
    <div class="result-card">
      <div class="color-bar" style="background: linear-gradient(90deg, ${result.nicho.cor}, ${result.nicho.corSecundaria})"></div>

      <div class="result-header">
        <div class="result-emoji" style="border: 1px solid ${result.nicho.cor}30; box-shadow: 0 0 30px ${result.nicho.cor}20;">${result.nicho.emoji}</div>
        <div class="result-meta">
          <h2 id="result-overlay-title" style="color: ${result.nicho.cor}">${result.nicho.nome}</h2>
          <p>${result.nicho.arquetipo} · ${result.nicho.virtudePromovida}</p>
        </div>
      </div>

      <div class="result-path">
        <span class="path-segment">${result.nicho.nome}</span>
        <span class="path-arrow">→</span>
        <span class="path-segment">${result.subtema.nome}</span>
        <span class="path-arrow">→</span>
        <span class="path-segment">${result.formato.icone} ${result.formato.nome}</span>
      </div>

      <div class="result-angle">
        "${result.angulo}"
      </div>

      <div class="result-actions">
        <button class="btn btn-primary" id="result-explore">
          🕸️ Explorar Nicho
        </button>
        <button class="btn" id="result-pipeline">
          ⚡ Rodar Pipeline
        </button>
        <button class="btn" id="result-spawn">
          🚀 Criar Canal
        </button>
        <button class="btn" id="result-reroll">
          🎲 Jogar de Novo
        </button>
        <button class="btn btn-danger" id="result-close">
          ✕ Fechar
        </button>
      </div>
    </div>
  `

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
