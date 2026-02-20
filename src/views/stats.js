/**
 * Stats View — Exploration history and taxonomy overview
 */

import { getAllNichos, getTaxonomyStats, getExplorationStats, countAngulos } from '../dice-engine.js'
import { navigateTo } from '../main.js'

export function renderStats(container) {
    const stats = getTaxonomyStats()
    const expStats = getExplorationStats()
    const nichos = getAllNichos()

    // Find most explored
    const maxExplorations = Math.max(...Object.values(expStats).map(s => s.explorations), 1)

    container.innerHTML = `
    <div class="stats-view">
      <h1>📊 BRAINET Dashboard</h1>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.nichos}</div>
          <div class="stat-label">Nichos Ativos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.subtemas}</div>
          <div class="stat-label">Subtemas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.formatos}</div>
          <div class="stat-label">Formatos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.angulos}</div>
          <div class="stat-label">Ângulos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.explorations}</div>
          <div class="stat-label">Total Rolls</div>
        </div>
      </div>

      <h2 style="font-size: 1.2rem; margin-bottom: var(--space-lg); color: var(--text-accent);">
        Exploração por Nicho
      </h2>

      <div class="exploration-list">
        ${nichos.map(nicho => {
        const exp = expStats[nicho.id]
        const barWidth = (exp.explorations / maxExplorations) * 100
        const angulos = countAngulos(nicho)

        return `
            <div class="exploration-item" data-nicho="${nicho.id}" style="cursor: pointer;">
              <div class="exp-info">
                <span class="exp-emoji">${nicho.emoji}</span>
                <div>
                  <div class="exp-name">${nicho.nome}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                    ${nicho.subtemas.length} subtemas · ${angulos} ângulos
                    ${nicho.canalExistente ? ` · 📺 ${nicho.canalExistente}` : ''}
                  </div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-md);">
                <div class="exp-bar">
                  <div class="exp-bar-fill" style="width: ${barWidth}%; background: ${nicho.cor};"></div>
                </div>
                <span class="exp-count">${exp.explorations} rolls</span>
              </div>
            </div>
          `
    }).join('')}
      </div>

      <div style="text-align: center; margin-top: var(--space-2xl);">
        <button class="btn btn-danger" id="reset-btn" style="font-size: 0.8rem;">
          🗑️ Resetar Histórico
        </button>
      </div>
    </div>
  `

    // Click on nicho to explore
    container.querySelectorAll('.exploration-item').forEach(item => {
        item.addEventListener('click', () => {
            const nichoId = item.dataset.nicho
            const nicho = nichos.find(n => n.id === nichoId)
            if (nicho) navigateTo('niche-detail', { nicho })
        })
    })

    // Reset
    container.querySelector('#reset-btn').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja resetar todo o histórico de explorações?')) {
            localStorage.removeItem('brainet_history')
            renderStats(container) // Re-render
        }
    })
}
