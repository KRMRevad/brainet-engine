/**
 * BRAINET MVP — Main Application Bootstrap + Router
 */

import './style.css'
import { getAllNichos, getTaxonomyStats } from './dice-engine.js'
import { renderLanding } from './views/landing.js'
import { renderGraph } from './views/graph.js'
import { renderNicheDetail } from './views/niche-detail.js'
import { renderChannelSpawner } from './views/channel-spawner.js'
import { renderPipeline } from './views/pipeline.js'
import { renderStats } from './views/stats.js'
import { renderJobs } from './views/jobs.js'
import { initParticles } from './components/particles.js'

// --- ROUTER ---
const views = {
    landing: { render: renderLanding, el: 'view-landing' },
    graph: { render: renderGraph, el: 'view-graph' },
    'niche-detail': { render: renderNicheDetail, el: 'view-niche-detail' },
    'channel-spawner': { render: renderChannelSpawner, el: 'view-channel-spawner' },
    pipeline: { render: renderPipeline, el: 'view-pipeline' },
    stats: { render: renderStats, el: 'view-stats' },
    jobs: { render: renderJobs, el: 'view-jobs' },
}

let currentView = 'landing'
let viewData = {}

export function navigateTo(viewName, data = {}) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active')
        v.innerHTML = ''
    })

    // Update nav
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.view === viewName)
    })

    // Show target
    const view = views[viewName]
    if (view) {
        const el = document.getElementById(view.el)
        el.classList.add('active')
        currentView = viewName
        viewData = data
        view.render(el, data)
    }
}

// --- INIT ---
function init() {
    // Nav click handlers
    document.querySelectorAll('[data-view]').forEach(el => {
        el.addEventListener('click', () => {
            navigateTo(el.dataset.view)
        })
    })

    // Update nav stats
    updateNavStats()

    // Render initial view
    navigateTo('landing')

    // Init particles background
    initParticles()
}

async function updateNavStats() {
    const stats = await getTaxonomyStats()
    const el = document.getElementById('nav-stats')
    el.innerHTML = `${stats.nichos} nichos · ${stats.angulos} ângulos · ${stats.explorations} rolls`
}

// Re-export for use in views
export { updateNavStats }

// Boot
document.addEventListener('DOMContentLoaded', init)
