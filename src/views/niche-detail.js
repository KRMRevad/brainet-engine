/**
 * Niche Detail View — Subtemas → Formatos → Ângulos cascade
 */

import { navigateTo } from '../main.js'
import { deepenNiche, countAngulos } from '../dice-engine.js'

export function renderNicheDetail(container, data = {}) {
    const { nicho, openSubtema } = data
    if (!nicho) {
        navigateTo('landing')
        return
    }

    const totalAngulos = countAngulos(nicho)

    container.innerHTML = `
    <div class="niche-detail">
      <button class="back-btn" id="back-btn">← Voltar</button>

      <div class="niche-detail-header">
        <div class="niche-detail-emoji" style="border-color: ${nicho.cor}30">${nicho.emoji}</div>
        <div class="niche-detail-info">
          <h1 style="color: ${nicho.cor}">${nicho.nome}</h1>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
            <span class="badge">${nicho.arquetipo}</span>
            <span class="badge">Cura: ${nicho.vicioCurado}</span>
            <span class="badge">Promove: ${nicho.virtudePromovida}</span>
            <span class="badge">${nicho.subtemas.length} subtemas · ${totalAngulos} ângulos</span>
            ${nicho.canalExistente ? `<span class="badge" style="color: var(--niche-temperanca)">📺 ${nicho.canalExistente}</span>` : '<span class="badge" style="color: var(--text-muted)">⏳ Canal não criado</span>'}
          </div>
        </div>
      </div>

      <div class="niche-detail-actions">
        <button class="btn btn-primary" id="dice-nicho">
          🎲 Sortear neste nicho
        </button>
        <button class="btn" id="spawn-nicho">
          🚀 Criar Canal
        </button>
        <button class="btn" id="graph-btn">
          🕸️ Ver no Grafo
        </button>
      </div>

      <div class="niche-detail-grid" id="subtemas-grid">
        ${nicho.subtemas.map(subtema => renderSubtemaCard(nicho, subtema, openSubtema === subtema.id)).join('')}
      </div>
    </div>
  `

    // Back button
    container.querySelector('#back-btn').addEventListener('click', () => {
        navigateTo('landing')
    })

    // Dice for this nicho
    container.querySelector('#dice-nicho').addEventListener('click', () => {
        const result = deepenNiche(nicho)
        navigateTo('pipeline', result)
    })

    // Spawn channel
    container.querySelector('#spawn-nicho').addEventListener('click', () => {
        navigateTo('channel-spawner', { nicho })
    })

    // Graph
    container.querySelector('#graph-btn').addEventListener('click', () => {
        navigateTo('graph')
    })

    // Subtema toggles
    container.querySelectorAll('.subtema-header').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.subtema-card')
            card.classList.toggle('open')
        })
    })

    // Angulo clicks
    container.querySelectorAll('.angulo-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const subtemaId = pill.dataset.subtema
            const formatoId = pill.dataset.formato
            const anguloText = pill.dataset.angulo

            const subtema = nicho.subtemas.find(s => s.id === subtemaId)
            const formato = subtema.formatos.find(f => f.id === formatoId)

            navigateTo('pipeline', {
                nicho,
                subtema,
                formato,
                angulo: anguloText,
            })
        })
    })
}

function renderSubtemaCard(nicho, subtema, isOpen) {
    const formatoCount = subtema.formatos.length
    const anguloCount = subtema.formatos.reduce((a, f) => a + f.angulos.length, 0)

    return `
    <div class="subtema-card ${isOpen ? 'open' : ''}">
      <div class="color-bar" style="background: linear-gradient(90deg, ${nicho.cor}, ${nicho.corSecundaria})"></div>
      <div class="subtema-header">
        <div>
          <div class="subtema-title">${subtema.nome}</div>
          <div class="subtema-desc">${subtema.descricao} · ${formatoCount} formatos · ${anguloCount} ângulos</div>
        </div>
        <span class="subtema-toggle">▼</span>
      </div>
      <div class="subtema-body">
        ${subtema.formatos.map(formato => `
          <div class="formato-group">
            <div class="formato-header">
              <span class="icon">${formato.icone}</span>
              ${formato.nome}
              <span style="color: var(--text-muted); font-weight: 400;">(${formato.angulos.length})</span>
            </div>
            <div class="angulo-list">
              ${formato.angulos.map(angulo => `
                <span class="angulo-pill" 
                      data-subtema="${subtema.id}" 
                      data-formato="${formato.id}" 
                      data-angulo="${angulo}"
                      title="${angulo}">
                  ${angulo}
                </span>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}
