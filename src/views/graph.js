/**
 * Graph View — Obsidian-like niche graph visualization
 * Uses vis-network for interactive node graph
 */

import { getAllNichos, countAngulos } from '../dice-engine.js'
import { navigateTo } from '../main.js'

let network = null

export function renderGraph(container) {
    const nichos = getAllNichos()

    container.innerHTML = `
    <div class="graph-container">
      <div id="niche-graph"></div>
      <div class="graph-legend">
        ${nichos.map(n => `
          <div class="legend-item" data-nicho="${n.id}">
            <span class="legend-dot" style="background: ${n.cor}"></span>
            <span>${n.emoji} ${n.nome}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `

    // Build nodes and edges
    const nodes = []
    const edges = []
    let nodeId = 0

    // Center node — BRAINET
    const centerNodeId = nodeId++
    nodes.push({
        id: centerNodeId,
        label: '🧠 BRAINET',
        shape: 'dot',
        size: 40,
        color: {
            background: '#1a1a2e',
            border: '#a78bfa',
            highlight: { background: '#2d1b69', border: '#a78bfa' },
            hover: { background: '#2d1b69', border: '#a78bfa' }
        },
        borderWidth: 3,
        font: { color: '#e8e8f0', size: 16, face: 'Inter', bold: true },
        _type: 'center'
    })

    nichos.forEach(nicho => {
        const nichoNodeId = nodeId++
        const angulos = countAngulos(nicho)

        // Nicho node
        nodes.push({
            id: nichoNodeId,
            label: `${nicho.emoji} ${nicho.nome}`,
            shape: 'dot',
            size: 25 + Math.min(angulos / 3, 15),
            color: {
                background: nicho.cor + '30',
                border: nicho.cor,
                highlight: { background: nicho.cor + '60', border: nicho.cor },
                hover: { background: nicho.cor + '50', border: nicho.cor }
            },
            borderWidth: 2,
            font: { color: '#e8e8f0', size: 13, face: 'Inter' },
            _type: 'nicho',
            _data: nicho,
        })

        // Edge from center to nicho
        edges.push({
            from: centerNodeId,
            to: nichoNodeId,
            color: { color: nicho.cor + '40', highlight: nicho.cor + '80', hover: nicho.cor + '60' },
            width: 2,
            smooth: { type: 'curvedCW', roundness: 0.2 },
        })

        // Subtemas
        nicho.subtemas.forEach(subtema => {
            const subtemaNodeId = nodeId++

            nodes.push({
                id: subtemaNodeId,
                label: subtema.nome,
                shape: 'dot',
                size: 12 + subtema.formatos.length * 2,
                color: {
                    background: nicho.cor + '15',
                    border: nicho.cor + '80',
                    highlight: { background: nicho.cor + '40', border: nicho.cor },
                    hover: { background: nicho.cor + '30', border: nicho.cor }
                },
                borderWidth: 1,
                font: { color: '#9090b0', size: 10, face: 'Inter' },
                _type: 'subtema',
                _data: { nicho, subtema },
            })

            edges.push({
                from: nichoNodeId,
                to: subtemaNodeId,
                color: { color: nicho.cor + '20', highlight: nicho.cor + '50', hover: nicho.cor + '30' },
                width: 1,
                smooth: { type: 'curvedCW', roundness: 0.15 },
            })

            // Format nodes (smaller)
            subtema.formatos.forEach(formato => {
                const formatoNodeId = nodeId++
                nodes.push({
                    id: formatoNodeId,
                    label: `${formato.icone} ${formato.angulos.length}`,
                    shape: 'dot',
                    size: 6 + formato.angulos.length,
                    color: {
                        background: nicho.cor + '10',
                        border: nicho.cor + '40',
                        highlight: { background: nicho.cor + '30', border: nicho.cor + '80' },
                        hover: { background: nicho.cor + '20', border: nicho.cor + '60' }
                    },
                    borderWidth: 1,
                    font: { color: '#606080', size: 8, face: 'Inter' },
                    _type: 'formato',
                    _data: { nicho, subtema, formato },
                })

                edges.push({
                    from: subtemaNodeId,
                    to: formatoNodeId,
                    color: { color: nicho.cor + '10', highlight: nicho.cor + '30' },
                    width: 0.5,
                })
            })
        })
    })

    // Use vis-network
    import('vis-network/standalone').then(({ Network, DataSet }) => {
        const graphContainer = document.getElementById('niche-graph')
        if (!graphContainer) return

        const data = {
            nodes: new DataSet(nodes),
            edges: new DataSet(edges),
        }

        const options = {
            physics: {
                enabled: true,
                barnesHut: {
                    gravitationalConstant: -3000,
                    centralGravity: 0.1,
                    springLength: 150,
                    springConstant: 0.02,
                    damping: 0.3,
                    avoidOverlap: 0.5,
                },
                stabilization: {
                    iterations: 200,
                    fit: true,
                },
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                zoomView: true,
                dragView: true,
                navigationButtons: false,
            },
            nodes: {
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.3)',
                    size: 10,
                },
            },
            edges: {
                shadow: false,
            },
        }

        network = new Network(graphContainer, data, options)

        // Node click — navigate to detail
        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const clickedId = params.nodes[0]
                const node = nodes.find(n => n.id === clickedId)
                if (node && node._type === 'nicho') {
                    navigateTo('niche-detail', { nicho: node._data })
                } else if (node && node._type === 'subtema') {
                    navigateTo('niche-detail', { nicho: node._data.nicho, openSubtema: node._data.subtema.id })
                }
            }
        })

        // Hover cursor
        network.on('hoverNode', () => {
            graphContainer.style.cursor = 'pointer'
        })
        network.on('blurNode', () => {
            graphContainer.style.cursor = 'default'
        })
    }).catch(() => {
        // Fallback if vis-network not loaded
        document.getElementById('niche-graph').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);">
        <p>Grafo requer <code>npm install</code> para carregar vis-network.</p>
      </div>
    `
    })

    // Legend click
    container.querySelectorAll('.legend-item').forEach(item => {
        item.addEventListener('click', () => {
            const nichoId = item.dataset.nicho
            const nicho = nichos.find(n => n.id === nichoId)
            if (nicho) {
                navigateTo('niche-detail', { nicho })
            }
        })
    })
}
