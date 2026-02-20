/**
 * Channel Spawner View — Generate a full channel from a niche
 */

import { spawnChannel } from '../channel-spawner.js'
import { navigateTo } from '../main.js'

export function renderChannelSpawner(container, data = {}) {
    const { nicho } = data
    if (!nicho) {
        navigateTo('landing')
        return
    }

    const channel = spawnChannel(nicho)

    container.innerHTML = `
    <div class="spawner">
      <button class="back-btn" id="back-btn">← Voltar</button>

      <div class="spawner-header">
        <div class="color-bar" style="background: linear-gradient(90deg, ${nicho.cor}, ${nicho.corSecundaria}); max-width: 200px; margin: 0 auto var(--space-md);"></div>
        <h1>${nicho.emoji} ${channel.nomeCanal}</h1>
        <p>Canal gerado a partir do nicho <strong>${nicho.nome}</strong></p>
      </div>

      <div class="spawner-grid">
        <!-- DNA -->
        <div class="spawner-section">
          <h3>🧬 DNA do Canal</h3>
          <ul>
            <li><span>Arquétipo</span> <span>${channel.dna.arquetipo}</span></li>
            <li><span>Tom</span> <span>${channel.dna.tom}</span></li>
            <li><span>Missão</span></li>
          </ul>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: var(--space-sm); line-height: 1.5;">
            ${channel.dna.missao}
          </p>
        </div>

        <!-- Persona -->
        <div class="spawner-section">
          <h3>👤 Persona Ideal</h3>
          <ul>
            <li><span>Idade</span> <span>${channel.dna.persona.idade}</span></li>
            <li><span>Dor</span> <span>${channel.dna.persona.dor}</span></li>
            <li><span>Desejo</span> <span>${channel.dna.persona.desejo}</span></li>
            <li><span>Nível</span> <span>${channel.dna.persona.nivel}</span></li>
          </ul>
        </div>

        <!-- Visual -->
        <div class="spawner-section">
          <h3>🎨 Identidade Visual</h3>
          <div style="display: flex; gap: 8px; margin-bottom: var(--space-md);">
            ${channel.dna.pilarVisual.corPrimaria ? `<div style="width:40px;height:40px;border-radius:8px;background:${channel.dna.pilarVisual.corPrimaria};border:1px solid rgba(255,255,255,0.1);"></div>` : ''}
            ${channel.dna.pilarVisual.corSecundaria ? `<div style="width:40px;height:40px;border-radius:8px;background:${channel.dna.pilarVisual.corSecundaria};border:1px solid rgba(255,255,255,0.1);"></div>` : ''}
            <div style="width:40px;height:40px;border-radius:8px;background:${channel.dna.pilarVisual.corFundo};border:1px solid rgba(255,255,255,0.1);"></div>
          </div>
          <ul>
            <li><span>Tipografia</span> <span>${channel.dna.pilarVisual.tipografia}</span></li>
            <li><span>Estilo</span> <span>${channel.dna.pilarVisual.estilo}</span></li>
          </ul>
        </div>

        <!-- Structure -->
        <div class="spawner-section">
          <h3>📁 Estrutura de Pastas</h3>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary); line-height: 1.8;">
            ${channel.estrutura.pastas.map(p => `<div style="padding-left: ${p.startsWith('0') ? '0' : '12'}px;">📂 ${p}</div>`).join('')}
          </div>
        </div>

        <!-- Plataformas -->
        <div class="spawner-section">
          <h3>📡 Distribuição</h3>
          <ul>
            ${channel.plataformas.map(p => `
              <li><span>${p.icone} ${p.nome}</span> <span style="color: var(--text-muted)">${p.tipo}</span></li>
            `).join('')}
          </ul>
        </div>

        <!-- Calendário -->
        <div class="spawner-section">
          <h3>📅 Calendário Semanal</h3>
          <ul>
            ${Object.entries(channel.calendarioSemanal).map(([dia, content]) => `
              <li><span style="text-transform: capitalize;">${dia}</span> <span style="color: var(--text-muted)">${content.formato}</span></li>
            `).join('')}
          </ul>
        </div>

        <!-- Produtos -->
        <div class="spawner-section" style="grid-column: 1 / -1;">
          <h3>💎 Escada de Produtos</h3>
          <ul>
            ${channel.produtos.map(p => `
              <li>
                <span><strong>Nível ${p.nivel}</strong> — ${p.nome}</span>
                <span class="price">${p.preco}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Comunidade -->
        <div class="spawner-section" style="grid-column: 1 / -1;">
          <h3>🏛️ Comunidade</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-md);">
            ${channel.comunidade.nome} — via ${channel.comunidade.plataforma}
          </p>
          <ul>
            ${channel.comunidade.niveis.map(n => `
              <li>
                <span><strong>${n.nivel}</strong> — ${n.descricao}</span>
                <span class="price">${n.preco}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>

      <!-- Potential stats -->
      <div style="text-align: center; margin-top: var(--space-2xl); padding: var(--space-lg); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
        <h3 style="color: var(--text-accent); margin-bottom: var(--space-md); font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase;">Potencial Infinito</h3>
        <div style="display: flex; justify-content: center; gap: var(--space-xl);">
          <div class="stat-item">
            <div class="stat-value" style="color: ${nicho.cor}">${channel.potencial.totalSubtemas}</div>
            <div class="stat-label">Subtemas</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${nicho.cor}">${channel.potencial.totalFormatos}</div>
            <div class="stat-label">Formatos</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${nicho.cor}">${channel.potencial.totalAngulos}</div>
            <div class="stat-label">Ângulos</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" style="color: ${nicho.cor}">∞</div>
            <div class="stat-label">Conteúdo</div>
          </div>
        </div>
      </div>
    </div>
  `

    // Back
    container.querySelector('#back-btn').addEventListener('click', () => {
        navigateTo('niche-detail', { nicho })
    })
}
