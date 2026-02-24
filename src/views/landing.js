/**
 * Landing View — The dice roller + hero
 */

import { feelingLucky, getTaxonomyStats } from '../dice-engine.js'
import { navigateTo, updateNavStats } from '../main.js'

export function renderLanding(container) {
    const stats = getTaxonomyStats()

    container.innerHTML = `
    <div class="landing">
      <div class="landing-hero">
        <p class="landing-subtitle">O Cérebro Criativo</p>
        <h1 class="landing-title">BRAINET</h1>
        <p class="landing-description">
          Um organismo vivo de produção de conteúdo. Cada nicho carrega subtemas, 
          formatos e infinitos ângulos — prontos para se tornarem canais, comunidades, 
          lojas e ferramentas.
        </p>
      </div>

      <div class="dice-container">
        <button class="dice-btn" id="dice-btn" aria-label="I'm Feeling Lucky">
          <span class="dice-icon">🎲</span>
          <span class="dice-label">Feeling Lucky</span>
        </button>
      </div>

      <div class="stats-strip">
        <div class="stat-item">
          <div class="stat-value">${stats.nichos}</div>
          <div class="stat-label">Nichos</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.subtemas}</div>
          <div class="stat-label">Subtemas</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.formatos}</div>
          <div class="stat-label">Formatos</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.angulos}</div>
          <div class="stat-label">Ângulos</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.explorations}</div>
          <div class="stat-label">Rolls</div>
        </div>
      </div>
    </div>
  `

    // Dice click handler
    const diceBtn = document.getElementById('dice-btn')
    diceBtn.addEventListener('click', () => {
        diceBtn.classList.add('rolling')

        setTimeout(() => {
            const result = feelingLucky()
            diceBtn.classList.remove('rolling')
            updateNavStats()
            showResultOverlay(result)
        }, 1800) // Wait for animation
    })
}

function showResultOverlay(result) {
    // Store reference to element that triggered the overlay for focus restore
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
        <div class="result-emoji" style="border: 1px solid ${result.nicho.cor}30">${result.nicho.emoji}</div>
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

    // Focus trap: collect focusable elements
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const getFocusableElements = () => overlay.querySelectorAll(focusableSelector)

    // Focus first button on open
    setTimeout(() => {
        const firstFocusable = getFocusableElements()[0]
        if (firstFocusable) firstFocusable.focus()
    }, 50)

    // Focus trap: prevent Tab from leaving dialog
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeOverlay()
            return
        }

        if (e.key !== 'Tab') return

        const focusableElements = getFocusableElements()
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        const activeElement = document.activeElement

        if (e.shiftKey) {
            // Shift+Tab on first element → focus last
            if (activeElement === firstElement) {
                e.preventDefault()
                lastElement.focus()
            }
        } else {
            // Tab on last element → focus first
            if (activeElement === lastElement) {
                e.preventDefault()
                firstElement.focus()
            }
        }
    }

    const closeOverlay = () => {
        overlay.removeEventListener('keydown', handleKeyDown)
        overlay.remove()
        // Restore focus to trigger element
        if (triggerElement && triggerElement.focus) {
            triggerElement.focus()
        }
    }

    overlay.addEventListener('keydown', handleKeyDown)

    // Close button
    overlay.querySelector('#result-close').addEventListener('click', closeOverlay)

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay()
    })

    // Actions
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
